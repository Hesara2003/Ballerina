import ballerina/http;
import ballerina/log;

// Bird email — configure in Config.toml (all required to enable)
// birdApiKey    : AccessKey from Bird Console → Developers → API Keys
// birdWorkspaceId : Bird Console → Settings → Workspace ID
// birdChannelId : Bird Console → Channels → your Email channel → ID
// senderEmail   : verified From address on that channel
// notificationEmail : manager inbox that receives new-request alerts

function notifyNewRequest(string employeeName, string systemName, string justification, string requestId) {
    if birdApiKey == "" || notificationEmail == "" { return; }
    string subject = string `[Access Portal] New request: ${systemName}`;
    string body = string `${employeeName} is requesting access to ${systemName}.

Justification: ${justification}
Request ID: ${requestId}

Log in to review: http://localhost:3000/approvals`;
    sendViaBird(notificationEmail, subject, body);
}

function notifyRequestReviewed(string employeeEmail, string employeeName, string systemName, string status, string? comment) {
    if birdApiKey == "" { return; }
    string subject = string `[Access Portal] Your request for ${systemName} was ${status.toLowerAscii()}`;
    string commentLine = comment is string && comment != "" ? string `\nReviewer comment: ${comment}` : "";
    string body = string `Hi ${employeeName},

Your request for access to ${systemName} has been ${status.toLowerAscii()}.${commentLine}

Log in to view details: http://localhost:3000`;
    sendViaBird(employeeEmail, subject, body);
}

function sendViaBird(string toAddr, string subject, string body) {
    if birdApiKey == "" || birdWorkspaceId == "" || birdChannelId == "" || senderEmail == "" {
        log:printInfo(string `[email-skip] Not configured. To: ${toAddr} | Subject: ${subject}`);
        return;
    }

    http:Client|error clientResult = new (string `https://api.bird.com`);
    if clientResult is error {
        log:printWarn("Bird HTTP client init failed: " + clientResult.message());
        return;
    }
    http:Client birdClient = clientResult;

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
            "type": "EMAIL",
            "text": {"text": body},
            "email": {
                "subject": subject,
                "from": {
                    "displayName": senderName,
                    "address": senderEmail
                }
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
        log:printWarn("Bird email send failed: " + resp.message());
        return;
    }
    if resp.statusCode >= 300 {
        string|error respBody = resp.getTextPayload();
        log:printWarn(string `Bird API returned ${resp.statusCode}: ${respBody is string ? respBody : "unknown"}`);
        return;
    }
    log:printInfo(string `[email-sent] To: ${toAddr} | Subject: ${subject}`);
}
