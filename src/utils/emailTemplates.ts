export function resetPasswordTemplate(resetLink: string) {
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

export function otpEmailTemplate(otp: string) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 480px;">
      <h2>Password Reset OTP</h2>
      <p>You requested a password reset. Use the OTP below to verify your identity:</p>
      <div style="
        font-size: 36px;
        font-weight: bold;
        letter-spacing: 8px;
        color: #2563eb;
        padding: 16px 0;
      ">${otp}</div>
      <p>This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <p style="color: #888; font-size: 13px;">If you did not request a password reset, ignore this email.</p>
    </div>
  `;
}
