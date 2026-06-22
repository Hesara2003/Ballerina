import ballerina/http;
import ballerina/log;

// Bird email — configure in Config.toml
// birdApiKey      : AccessKey from Bird Console → User Settings → Security → Access Keys
// birdWorkspaceId : User Settings → Organization → Workspaces
// birdChannelId   : Email channel settings page
// senderEmail     : verified From address on that channel (optional — channel default used if blank)
// notificationEmail : manager inbox for new-request alerts

function notifyNewRequest(string employeeName, string systemName, string justification, string requestId) {
    if birdApiKey == "" || notificationEmail == "" { return; }

    string subject = string `[Access Portal] New access request: ${systemName}`;
    string html = string `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#1d4ed8">New Access Request</h2>
          <p><strong>${employeeName}</strong> is requesting access to <strong>${systemName}</strong>.</p>
          <table style="border-collapse:collapse;width:100%;margin:16px 0">
            <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold;width:140px">Justification</td>
                <td style="padding:8px;border:1px solid #e5e7eb">${justification}</td></tr>
            <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold">Request ID</td>
                <td style="padding:8px;border:1px solid #e5e7eb">${requestId}</td></tr>
          </table>
          <a href="http://localhost:3000/approvals" style="display:inline-block;padding:10px 20px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">
            Review Request
          </a>
        </div>`;
    string text = string `${employeeName} is requesting access to ${systemName}.\n\nJustification: ${justification}\nRequest ID: ${requestId}\n\nLog in to review: http://localhost:3000/approvals`;

    sendViaBird(notificationEmail, subject, html, text);
}

function notifyRequestReviewed(string employeeEmail, string employeeName, string systemName, string status, string? comment) {
    if birdApiKey == "" { return; }

    string statusLower = status.toLowerAscii();
    string color = status == "APPROVED" ? "#16a34a" : "#dc2626";
    string commentRow = (comment is string && comment != "")
        ? string `<tr><td style="padding:8px;background:#f3f4f6;font-weight:bold;width:140px">Comment</td>
                   <td style="padding:8px;border:1px solid #e5e7eb">${comment}</td></tr>`
        : "";
    string commentText = (comment is string && comment != "") ? string `\nReviewer comment: ${comment}` : "";

    string subject = string `[Access Portal] Your request for ${systemName} was ${statusLower}`;
    string html = string `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:${color}">Request ${status}</h2>
          <p>Hi <strong>${employeeName}</strong>,</p>
          <p>Your request for access to <strong>${systemName}</strong> has been <strong style="color:${color}">${statusLower}</strong>.</p>
          <table style="border-collapse:collapse;width:100%;margin:16px 0">
            <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold;width:140px">System</td>
                <td style="padding:8px;border:1px solid #e5e7eb">${systemName}</td></tr>
            <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold">Status</td>
                <td style="padding:8px;border:1px solid #e5e7eb;color:${color};font-weight:bold">${status}</td></tr>
            ${commentRow}
          </table>
          <a href="http://localhost:3000" style="display:inline-block;padding:10px 20px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">
            View Details
          </a>
        </div>`;
    string text = string `Hi ${employeeName},\n\nYour request for ${systemName} has been ${statusLower}.${commentText}\n\nLog in: http://localhost:3000`;

    sendViaBird(employeeEmail, subject, html, text);
}

function sendViaBird(string toAddr, string subject, string htmlBody, string textBody) {
    if birdApiKey == "" || birdWorkspaceId == "" || birdChannelId == "" {
        log:printInfo(string `[email-skip] Bird not configured. To: ${toAddr} | ${subject}`);
        return;
    }

    http:Client|error clientResult = new ("https://api.bird.com");
    if clientResult is error {
        log:printWarn("Bird client init failed: " + clientResult.message());
        return;
    }
    http:Client birdClient = clientResult;

    json fromField = senderEmail != "" ? {"displayName": senderName, "address": senderEmail} : {"displayName": senderName};

    json payload = {
        "receiver": {
            "contacts": [
                {
                    "identifierKey": "emailaddress",
                    "identifierValue": toAddr
                }
            ]
        },
        "body": {
            "type": "html",
            "html": {
                "metadata": {
                    "subject": subject,
                    "from": fromField
                },
                "html": htmlBody,
                "text": textBody
            }
        }
    };

    http:Request req = new;
    req.setHeader("Authorization", string `AccessKey ${birdApiKey}`);
    req.setJsonPayload(payload);

    http:Response|error resp = birdClient->post(
        string `/workspaces/${birdWorkspaceId}/channels/${birdChannelId}/messages`,
        req
    );

    if resp is error {
        log:printWarn("Bird email failed: " + resp.message());
        return;
    }
    if resp.statusCode >= 300 {
        string|error body = resp.getTextPayload();
        log:printWarn(string `Bird API ${resp.statusCode}: ${body is string ? body : "unknown"}`);
        return;
    }
    log:printInfo(string `[email-sent] To: ${toAddr} | ${subject}`);
}
