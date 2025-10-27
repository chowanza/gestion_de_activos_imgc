export const dynamic = 'force-dynamic';

import ResetPasswordClient from './ResetPasswordClient';

export default function Page() {
  // Server wrapper — the heavy client logic lives in ResetPasswordClient
  return <ResetPasswordClient />;
}