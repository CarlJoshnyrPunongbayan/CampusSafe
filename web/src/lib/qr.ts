/** What the mobile app reads when it scans a printed location tag. */
export function qrPayload(tagId: string) {
  return `campussafe://location/${tagId}`
}
