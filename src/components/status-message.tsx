export function StatusMessage({
  message,
  tone = 'neutral',
  stamp = false,
}: {
  message: string | null;
  tone?: 'neutral' | 'success' | 'error';
  stamp?: boolean;
}) {
  if (!message) return null;
  return (
    <p className={`status-message status-${tone} ${stamp ? 'status-publish' : ''}`} role={tone === 'error' ? 'alert' : 'status'}>
      {message}
    </p>
  );
}
