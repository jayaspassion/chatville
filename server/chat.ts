// Twitch authenticates the sender login. Matching it to the channel owner is
// sufficient; optional IRC badge metadata must not block the broadcaster.
export function isChannelOwner(username: string, target: string, configuredChannel: string) {
  const normalize = (value: string) => value.trim().replace(/^#/, '').toLowerCase();
  return normalize(target) === normalize(configuredChannel) && normalize(username) === normalize(configuredChannel);
}
