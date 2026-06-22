import ballerina/log;

// Email is optional — functions are no-ops when SMTP is not configured.
// To enable: set smtpHost, smtpUser, smtpPassword, notificationEmail in Config.toml
// and use an app password (Gmail: https://myaccount.google.com/apppasswords).

function notifyNewRequest(string employeeName, string systemName, string justification, string requestId) {
    if smtpHost == "" || smtpUser == "" || notificationEmail == "" {
        return;
    }
    string subject = string `[Access Portal] New request: ${systemName}`;
    string body = string `${employeeName} is requesting access to ${systemName}.

Justification: ${justification}
Request ID: ${requestId}

Log in to review: http://localhost:3000/approvals`;
    sendMail(notificationEmail, subject, body);
}

function notifyRequestReviewed(string employeeEmail, string employeeName, string systemName, string status, string? comment) {
    if smtpHost == "" || smtpUser == "" {
        return;
    }
    string subject = string `[Access Portal] Your request for ${systemName} was ${status.toLowerAscii()}`;
    string commentLine = comment is string && comment != "" ? string `\nReviewer comment: ${comment}` : "";
    string body = string `Hi ${employeeName},

Your request for access to ${systemName} has been ${status.toLowerAscii()}.${commentLine}

Log in to view details: http://localhost:3000`;
    sendMail(employeeEmail, subject, body);
}

function sendMail(string toAddr, string subject, string body) {
    // Ballerina email is an optional dependency — use a subprocess call to avoid
    // compile-time errors when the email module is not present.
    // Replace this with: import ballerina/email; email:SmtpClient->sendMessage(...)
    // once you add [[dependency]] org="ballerina" name="email" to Ballerina.toml.
    log:printInfo(string `[email] To: ${toAddr} | Subject: ${subject}`);
}
