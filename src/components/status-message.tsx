export function StatusMessage({
  message,
  tone = 'neutral',
}: {
  message: string | null;
  tone?: 'neutral' | 'success' | 'error';
}) {
  if (!message) return null;
  return (
    <p className={`status-message status-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {message}
    </p>
  );
}
