import 'dotenv/config';
import { createServer } from 'node:http';
import tmi from 'tmi.js';
import { WebSocketServer, WebSocket } from 'ws';
import { createVillage } from './village.js';
import { isChannelOwner } from './chat.js';
const village = createVillage();
let sendChat: ((message: string, priority?: boolean) => void) | undefined;
function flushAnnouncements() {
  const notices = village.drainAnnouncements();
  for (const notice of notices) if (!notice.simulation) sendChat?.(notice.text,notice.priority);
  return notices.filter(notice => notice.simulation).map(notice => notice.text);
}
const development = process.env.NODE_ENV !== 'production';
const server = createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'GET' && req.url === '/health') { res.end(JSON.stringify({ok:true,twitchConnected:village.state.twitchConnected})); return; }
  if (development && req.method === 'POST' && req.url === '/simulate') {
    // Only local callers; simulation never sends a message to Twitch.
    if (req.headers.origin && !['http://localhost:5173','http://127.0.0.1:5173'].includes(req.headers.origin)) {res.writeHead(403).end('{}');return;}
    try {
      let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 4096) {res.writeHead(413).end('{}');return;} }
      const data = JSON.parse(body);
      if (typeof data.username !== 'string' || !/^[a-zA-Z0-9_]{1,25}$/.test(data.username) || typeof data.command !== 'string' || data.command.length > 100) {res.writeHead(400).end(JSON.stringify({error:'Provide a Twitch username and command.'}));return;}
      const result = village.command(`sim:${data.username.toLowerCase()}`, data.username, data.command, data.isBroadcaster === true, true);
      if (result.changed) broadcast();
      res.end(JSON.stringify({...result,announcements:flushAnnouncements()}));
    } catch { res.writeHead(400).end(JSON.stringify({error:'Invalid request.'})); }
    return;
  }
  res.writeHead(404).end('{}');
});
const sockets = new WebSocketServer({server,path:'/ws'});
function broadcast() { const state = JSON.stringify(village.state); for (const client of sockets.clients) if (client.readyState === WebSocket.OPEN) client.send(state); }
setInterval(() => { if (village.advance()) broadcast(); flushAnnouncements(); }, 100);
sockets.on('connection', socket => {socket.on('error',()=>{});if (village.advance()) broadcast();flushAnnouncements();socket.send(JSON.stringify(village.state));});
server.listen(3001,'127.0.0.1',()=>console.log('Chatville server ready. Overlay: http://localhost:5173 (1920 × 1080)'));
const channel = process.env.TWITCH_CHANNEL?.trim().replace(/^#/, '').toLowerCase();
const username = process.env.TWITCH_BOT_USERNAME?.trim().toLowerCase();
const rawToken = process.env.TWITCH_OAUTH_TOKEN?.trim();
if (channel && username && rawToken && ![channel,username,rawToken].some(v => v.startsWith('your_'))) {
  const password = rawToken.startsWith('oauth:') ? rawToken : `oauth:${rawToken}`;
  // Disable library logging so credentials or raw chat never reach logs.
  const client = new tmi.Client({options:{debug:false,skipUpdatingEmotesets:true},logger:{info(){},warn(){},error(){}},connection:{secure:true,reconnect:true},identity:{username,password},channels:[channel]});
  const replyQueue: string[] = [];
  let lastSentAt = 0;
  const sendNext = () => {
    if (!village.state.twitchConnected || !replyQueue.length || Date.now()-lastSentAt<1800) return;
    lastSentAt=Date.now();
    void client.say(channel,replyQueue.shift()!).catch(()=>console.log('Chat reply could not be sent.'));
  };
  sendChat = (message,priority=false) => {
    if(priority)replyQueue.unshift(message);else replyQueue.push(message);
    sendNext();
  };
  // Launch warnings jump ahead of milestone chatter, within the chat rate limit.
  setInterval(sendNext,100);
  client.on('join',(joined,who,self)=>{if(self){village.state.twitchConnected=true;broadcast();console.log(`Chatville joined ${joined}. Overlay: http://localhost:5173`);}});
  client.on('disconnected',()=>{village.state.twitchConnected=false;broadcast();console.log('Twitch disconnected; waiting to reconnect.');});
  client.on('message',(target,tags,message,self)=>{
    // The broadcaster also uses the bot account: accept their commands.
    // Bot replies start with @username, so they cannot trigger commands again.
    if(!tags['user-id'] || !tags.username) return;
    const result = village.command(tags['user-id'],tags.username,message,isChannelOwner(tags.username,target,channel));
    if(result.changed) broadcast();
    if(result.reply) sendChat?.(`@${tags.username} ${result.reply}`);
    // The public guide uses short numbered messages, without repeated @mentions.
    for(const line of result.replies??[]) sendChat?.(line);
    flushAnnouncements();
  });
  void client.connect().catch(()=>console.log('Twitch connection failed. Check local credentials and chat:read / chat:edit scopes.'));
} else console.log('Twitch credentials missing: local simulation is available; real channel verification is pending.');
