export function authErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : "";
  if (/invalid login|invalid credentials|invalid email or password/i.test(raw)) {
    return "メールアドレスまたはパスワードが違います";
  }
  if (/already registered|already been registered|user already exists/i.test(raw)) {
    return "このメールアドレスは登録済みです";
  }
  if (/password/i.test(raw) && /least|characters|6/i.test(raw)) {
    return "パスワードは6文字以上にしてください";
  }
  if (/rate limit|too many/i.test(raw)) {
    return "試行回数が多すぎます。しばらく待ってください";
  }
  if (/email not confirmed|confirm/i.test(raw)) {
    return "確認メールのリンクを開いてからログインしてください";
  }
  return "処理に失敗しました。時間をおいて再度お試しください。";
}
