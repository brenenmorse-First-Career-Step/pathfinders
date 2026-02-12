
export const WelcomeEmailTemplate = (fullName: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; font-size: 12px; color: #888; margin-top: 20px; }
        .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to First Career Steps!</h1>
        </div>
        <div class="content">
            <p>Hi ${fullName},</p>
            <p>We are thrilled to have you on board! You have successfully created your account.</p>
            <p>Start building your resume and taking the first steps towards your dream career.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Go to Dashboard</a></p>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} First Career Steps. All rights reserved.
        </div>
    </div>
</body>
</html>
`;

export const PasswordResetEmailTemplate = (resetLink: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; font-size: 12px; color: #888; margin-top: 20px; }
        .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <p>We received a request to reset your password. Click the button below to proceed.</p>
            <p><a href="${resetLink}" class="button">Reset Password</a></p>
            <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} First Career Steps. All rights reserved.
        </div>
    </div>
</body>
</html>
`;

export const PaymentSuccessEmailTemplate = (fullName: string, amount: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; font-size: 12px; color: #888; margin-top: 20px; }
        .button { display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Payment Successful!</h1>
        </div>
        <div class="content">
            <p>Hi ${fullName},</p>
            <p>Thank you for your payment of <strong>${amount}</strong>.</p>
            <p>Your transaction was successful, and your account has been updated.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">View Dashboard</a></p>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} First Career Steps. All rights reserved.
        </div>
    </div>
</body>
</html>
`;

export const PaymentFailedEmailTemplate = (fullName: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; font-size: 12px; color: #888; margin-top: 20px; }
        .button { display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Payment Failed</h1>
        </div>
        <div class="content">
            <p>Hi ${fullName},</p>
            <p>Unfortunately, your recent payment attempt failed.</p>
            <p>Please update your payment method and try again.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing" class="button">Update Payment Method</a></p>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} First Career Steps. All rights reserved.
        </div>
    </div>
</body>
</html>
`;
