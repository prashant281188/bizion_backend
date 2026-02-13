export function resetPasswordTemplate(
  resetLink: string
) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password.</p>
      <p>Click the button below to reset it:</p>
      <a 
        href="${resetLink}" 
        style="
          display:inline-block;
          padding:10px 20px;
          background:#2563eb;
          color:white;
          text-decoration:none;
          border-radius:5px;
        "
      >
        Reset Password
      </a>
      <p style="margin-top:20px;">
        This link expires in 15 minutes.
      </p>
    </div>
  `;
}
