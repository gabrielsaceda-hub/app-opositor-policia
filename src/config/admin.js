export const ADMIN_EMAILS = ['oposicionfisica@gmail.com', 'gabriel.saceda@gmail.com']

export function isAdminUser(user) {
  return ADMIN_EMAILS.includes(user?.email?.toLowerCase())
}
