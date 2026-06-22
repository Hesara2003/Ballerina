import ballerina/http;
import ballerina/jwt;
import ballerina/log;
import ballerina/time;
import ballerina/uuid;

// ── Config ─────────────────────────────────────────────────────────────────

configurable string asgardeoOrg = "hesara";
configurable string clientId = ?;
configurable string clientSecret = ?;
configurable string mgmtClientId = "";
configurable string mgmtClientSecret = "";
configurable string[] managerEmails = [];

// MySQL
configurable string dbHost = "localhost";
configurable int dbPort = 3306;
configurable string dbUser = ?;
configurable string dbPassword = ?;
configurable string dbName = "access_portal";

// Bird email (optional — leave empty to disable)
// Get these from bird.com → Console → Developers / Channels
configurable string birdApiKey = "";
configurable string birdWorkspaceId = "";
configurable string birdChannelId = "";
configurable string senderEmail = "";
configurable string senderName = "Access Request Portal";
configurable string notificationEmail = "";

// ── Types ───────────────────────────────────────────────────────────────────

type SystemResource record {|
    string id;
    string name;
    string description;
    string category;
    string asgardeoGroupId;
|};

type AdminSystem record {|
    string id;
    string name;
    string description;
    string category;
    string asgardeoGroupId;
    boolean isActive;
    string createdAt;
|};

type SystemPayload record {|
    string id;
    string name;
    string description;
    string category;
    string asgardeoGroupId;
|};

type AccessRequest record {|
    string id;
    string employeeId;
    string employeeName;
    string employeeEmail;
    string systemId;
    string systemName;
    string asgardeoGroupId;
    string justification;
    string status;
    string requestedAt;
    string? reviewedBy = ();
    string? reviewedAt = ();
    string? reviewComment = ();
|};

type NewRequestPayload record {|
    string systemId;
    string justification;
|};

type ReviewPayload record {|
    string comment = "";
|};

type UserContext record {|
    string userId;
    string userName;
    string userEmail;
    boolean isManager;
|};

type SystemStat record {|
    string systemName;
    int pending;
    int approved;
    int rejected;
|};

type DayStat record {|
    string date;
    int count;
|};

type AnalyticsResponse record {|
    int total;
    int pending;
    int approved;
    int rejected;
    SystemStat[] bySystem;
    DayStat[] recentActivity;
|};

type AuditEntry record {|
    int id;
    string action;
    string performedBy;
    string performedByEmail;
    string? targetId;
    string? details;
    string createdAt;
|};

// ── Service ─────────────────────────────────────────────────────────────────

@http:ServiceConfig {
    cors: {
        allowOrigins: ["http://localhost:3000"],
        allowCredentials: false,
        allowHeaders: ["Authorization", "Content-Type", "x-jwt-assertion"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    },
    auth: [
        {
            jwtValidatorConfig: {
                issuer: string `https://api.asgardeo.io/t/${asgardeoOrg}/oauth2/token`,
                audience: clientId,
                signatureConfig: {
                    jwksConfig: {
                        url: string `https://api.asgardeo.io/t/${asgardeoOrg}/oauth2/jwks`
                    }
                }
            }
        }
    ]
}
service / on new http:Listener(8080) {

    // ── Profile ──────────────────────────────────────────────────────────

    resource function get profile(http:Request req) returns json|http:InternalServerError {
        UserContext|error ctx = extractUserContext(req);
        if ctx is error { return <http:InternalServerError>{body: ctx.message()}; }
        return {userId: ctx.userId, userName: ctx.userName, userEmail: ctx.userEmail, isManager: ctx.isManager};
    }

    // ── Systems (employee read) ──────────────────────────────────────────

    resource function get systems(http:Request req) returns SystemResource[]|http:InternalServerError {
        SystemResource[]|error systems = dbGetSystems();
        if systems is error { return <http:InternalServerError>{body: systems.message()}; }
        return systems;
    }

    // ── Requests ─────────────────────────────────────────────────────────

    resource function post requests(http:Request req, @http:Payload NewRequestPayload body)
            returns AccessRequest|http:BadRequest|http:NotFound|http:InternalServerError {

        UserContext|error ctx = extractUserContext(req);
        if ctx is error { return <http:InternalServerError>{body: ctx.message()}; }

        SystemResource|error|() sys = dbFindSystem(body.systemId);
        if sys is error { return <http:InternalServerError>{body: sys.message()}; }
        if sys is () { return <http:NotFound>{body: string `System '${body.systemId}' not found`}; }

        boolean|error hasPending = dbHasPendingRequest(ctx.userId, body.systemId);
        if hasPending is error { return <http:InternalServerError>{body: hasPending.message()}; }
        if hasPending { return <http:BadRequest>{body: "You already have a pending request for this system"}; }

        string id = uuid:createType4AsString();
        AccessRequest newReq = {
            id: id,
            employeeId: ctx.userId,
            employeeName: ctx.userName,
            employeeEmail: ctx.userEmail,
            systemId: body.systemId,
            systemName: sys.name,
            asgardeoGroupId: sys.asgardeoGroupId,
            justification: body.justification,
            status: "PENDING",
            requestedAt: time:utcToString(time:utcNow())
        };

        error? saved = dbCreateRequest(newReq);
        if saved is error { return <http:InternalServerError>{body: saved.message()}; }

        dbLogAudit("REQUEST_SUBMITTED", ctx.userName, ctx.userEmail, id, string `${ctx.userName} requested access to ${sys.name}`);
        notifyNewRequest(ctx.userName, sys.name, body.justification, id);
        return newReq;
    }

    resource function get requests(http:Request req) returns AccessRequest[]|http:InternalServerError {
        UserContext|error ctx = extractUserContext(req);
        if ctx is error { return <http:InternalServerError>{body: ctx.message()}; }

        AccessRequest[]|error result = dbGetRequests(ctx.userId, ctx.isManager);
        if result is error { return <http:InternalServerError>{body: result.message()}; }
        return result;
    }

    resource function put requests/[string id]/approve(http:Request req, @http:Payload ReviewPayload body)
            returns AccessRequest|http:NotFound|http:BadRequest|http:Forbidden|http:InternalServerError {

        UserContext|error ctx = extractUserContext(req);
        if ctx is error { return <http:InternalServerError>{body: ctx.message()}; }
        if !ctx.isManager { return <http:Forbidden>{body: "Only managers can approve requests"}; }

        AccessRequest|error|() existing = dbGetRequest(id);
        if existing is error { return <http:InternalServerError>{body: existing.message()}; }
        if existing is () { return <http:NotFound>{body: string `Request '${id}' not found`}; }
        if existing.status != "PENDING" { return <http:BadRequest>{body: "Request is not pending"}; }

        if mgmtClientId != "" && mgmtClientSecret != "" {
            error? groupResult = addUserToAsgardeoGroup(existing.asgardeoGroupId, existing.employeeId);
            if groupResult is error { log:printWarn("Asgardeo group update skipped: " + groupResult.message()); }
        }

        string now = time:utcToString(time:utcNow());
        string? comment = body.comment == "" ? () : body.comment;
        AccessRequest|error updated = dbUpdateRequestStatus(id, "APPROVED", ctx.userName, now, comment);
        if updated is error { return <http:InternalServerError>{body: updated.message()}; }

        dbLogAudit("REQUEST_APPROVED", ctx.userName, ctx.userEmail, id, string `${ctx.userName} approved access to ${existing.systemName} for ${existing.employeeName}`);
        notifyRequestReviewed(existing.employeeEmail, existing.employeeName, existing.systemName, "APPROVED", comment);
        return updated;
    }

    resource function put requests/[string id]/reject(http:Request req, @http:Payload ReviewPayload body)
            returns AccessRequest|http:NotFound|http:BadRequest|http:Forbidden|http:InternalServerError {

        UserContext|error ctx = extractUserContext(req);
        if ctx is error { return <http:InternalServerError>{body: ctx.message()}; }
        if !ctx.isManager { return <http:Forbidden>{body: "Only managers can reject requests"}; }

        AccessRequest|error|() existing = dbGetRequest(id);
        if existing is error { return <http:InternalServerError>{body: existing.message()}; }
        if existing is () { return <http:NotFound>{body: string `Request '${id}' not found`}; }
        if existing.status != "PENDING" { return <http:BadRequest>{body: "Request is not pending"}; }

        string now = time:utcToString(time:utcNow());
        string? comment = body.comment == "" ? () : body.comment;
        AccessRequest|error updated = dbUpdateRequestStatus(id, "REJECTED", ctx.userName, now, comment);
        if updated is error { return <http:InternalServerError>{body: updated.message()}; }

        dbLogAudit("REQUEST_REJECTED", ctx.userName, ctx.userEmail, id, string `${ctx.userName} rejected access to ${existing.systemName} for ${existing.employeeName}`);
        notifyRequestReviewed(existing.employeeEmail, existing.employeeName, existing.systemName, "REJECTED", comment);
        return updated;
    }

    // ── Analytics (manager only) ─────────────────────────────────────────

    resource function get analytics(http:Request req) returns AnalyticsResponse|http:Forbidden|http:InternalServerError {
        UserContext|error ctx = extractUserContext(req);
        if ctx is error { return <http:InternalServerError>{body: ctx.message()}; }
        if !ctx.isManager { return <http:Forbidden>{body: "Manager access required"}; }

        AnalyticsResponse|error result = dbGetAnalytics();
        if result is error { return <http:InternalServerError>{body: result.message()}; }
        return result;
    }

    // ── Admin: systems management (manager only) ─────────────────────────

    resource function get admin/systems(http:Request req) returns AdminSystem[]|http:Forbidden|http:InternalServerError {
        UserContext|error ctx = extractUserContext(req);
        if ctx is error { return <http:InternalServerError>{body: ctx.message()}; }
        if !ctx.isManager { return <http:Forbidden>{body: "Manager access required"}; }

        AdminSystem[]|error result = dbGetAdminSystems();
        if result is error { return <http:InternalServerError>{body: result.message()}; }
        return result;
    }

    resource function post admin/systems(http:Request req, @http:Payload SystemPayload body)
            returns AdminSystem[]|http:Forbidden|http:BadRequest|http:InternalServerError {

        UserContext|error ctx = extractUserContext(req);
        if ctx is error { return <http:InternalServerError>{body: ctx.message()}; }
        if !ctx.isManager { return <http:Forbidden>{body: "Manager access required"}; }
        if body.id == "" || body.name == "" { return <http:BadRequest>{body: "id and name are required"}; }

        error? result = dbCreateSystem(body.id, body.name, body.description, body.category, body.asgardeoGroupId);
        if result is error { return <http:InternalServerError>{body: result.message()}; }

        dbLogAudit("SYSTEM_CREATED", ctx.userName, ctx.userEmail, body.id, string `Created system: ${body.name}`);
        AdminSystem[]|error systems = dbGetAdminSystems();
        if systems is error { return <http:InternalServerError>{body: systems.message()}; }
        return systems;
    }

    resource function put admin/systems/[string id](http:Request req, @http:Payload SystemPayload body)
            returns AdminSystem[]|http:Forbidden|http:NotFound|http:InternalServerError {

        UserContext|error ctx = extractUserContext(req);
        if ctx is error { return <http:InternalServerError>{body: ctx.message()}; }
        if !ctx.isManager { return <http:Forbidden>{body: "Manager access required"}; }

        error? result = dbUpdateSystem(id, body.name, body.description, body.category, body.asgardeoGroupId);
        if result is error { return <http:InternalServerError>{body: result.message()}; }

        dbLogAudit("SYSTEM_UPDATED", ctx.userName, ctx.userEmail, id, string `Updated system: ${body.name}`);
        AdminSystem[]|error systems = dbGetAdminSystems();
        if systems is error { return <http:InternalServerError>{body: systems.message()}; }
        return systems;
    }

    resource function delete admin/systems/[string id](http:Request req)
            returns AdminSystem[]|http:Forbidden|http:InternalServerError {

        UserContext|error ctx = extractUserContext(req);
        if ctx is error { return <http:InternalServerError>{body: ctx.message()}; }
        if !ctx.isManager { return <http:Forbidden>{body: "Manager access required"}; }

        error? result = dbToggleSystem(id, false);
        if result is error { return <http:InternalServerError>{body: result.message()}; }

        dbLogAudit("SYSTEM_DEACTIVATED", ctx.userName, ctx.userEmail, id, string `Deactivated system: ${id}`);
        AdminSystem[]|error systems = dbGetAdminSystems();
        if systems is error { return <http:InternalServerError>{body: systems.message()}; }
        return systems;
    }

    resource function put admin/systems/[string id]/activate(http:Request req)
            returns AdminSystem[]|http:Forbidden|http:InternalServerError {

        UserContext|error ctx = extractUserContext(req);
        if ctx is error { return <http:InternalServerError>{body: ctx.message()}; }
        if !ctx.isManager { return <http:Forbidden>{body: "Manager access required"}; }

        error? result = dbToggleSystem(id, true);
        if result is error { return <http:InternalServerError>{body: result.message()}; }

        dbLogAudit("SYSTEM_ACTIVATED", ctx.userName, ctx.userEmail, id, string `Activated system: ${id}`);
        AdminSystem[]|error systems = dbGetAdminSystems();
        if systems is error { return <http:InternalServerError>{body: systems.message()}; }
        return systems;
    }

    // ── Admin: audit log ─────────────────────────────────────────────────

    resource function get admin/audit\-log(http:Request req) returns AuditEntry[]|http:Forbidden|http:InternalServerError {
        UserContext|error ctx = extractUserContext(req);
        if ctx is error { return <http:InternalServerError>{body: ctx.message()}; }
        if !ctx.isManager { return <http:Forbidden>{body: "Manager access required"}; }

        AuditEntry[]|error result = dbGetAuditLog(200);
        if result is error { return <http:InternalServerError>{body: result.message()}; }
        return result;
    }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function extractUserContext(http:Request req) returns UserContext|error {
    string token = "";
    string|http:HeaderNotFoundError xjwt = req.getHeader("x-jwt-assertion");
    if xjwt is string {
        token = xjwt;
    } else {
        string authHeader = check req.getHeader("Authorization");
        token = authHeader.substring(7);
    }

    [jwt:Header, jwt:Payload] [_, payload] = check jwt:decode(token);

    string userId = payload.sub ?: "unknown";
    string userName = userId;
    string userEmail = "";
    boolean isManager = false;

    anydata emailData = payload["email"] ?: "";
    anydata nameData = payload["username"] ?: payload["preferred_username"] ?: "";
    userEmail = emailData.toString();
    string nameStr = nameData.toString();
    if nameStr != "" { userName = nameStr; }

    anydata rolesData = payload["roles"] ?: [];
    if rolesData is anydata[] {
        foreach anydata role in rolesData {
            string roleStr = role.toString().toLowerAscii();
            if roleStr == "manager" || roleStr == "admin" { isManager = true; }
        }
    }

    anydata groupsData = payload["groups"] ?: [];
    if !isManager && groupsData is anydata[] {
        foreach anydata grp in groupsData {
            string grpStr = grp.toString().toLowerAscii();
            if grpStr.includes("manager") || grpStr.includes("admin") { isManager = true; }
        }
    }

    if !isManager {
        foreach string email in managerEmails {
            if email == userEmail { isManager = true; break; }
        }
    }

    return {userId, userName, userEmail, isManager};
}

function addUserToAsgardeoGroup(string groupId, string userId) returns error? {
    if groupId.startsWith("PLACEHOLDER") { return; }

    http:Client tokenClient = check new(string `https://api.asgardeo.io/t/${asgardeoOrg}/oauth2/token`);
    http:Request tokenReq = new;
    tokenReq.setTextPayload(
        string `grant_type=client_credentials&client_id=${mgmtClientId}&client_secret=${mgmtClientSecret}&scope=internal_group_mgt_update`,
        contentType = "application/x-www-form-urlencoded"
    );
    http:Response tokenResp = check tokenClient->post("", tokenReq);
    json tokenBody = check tokenResp.getJsonPayload();
    string accessToken = (check tokenBody.access_token).toString();

    http:Client scimClient = check new(string `https://api.asgardeo.io/t/${asgardeoOrg}/scim2`);
    http:Request patchReq = new;
    patchReq.setHeader("Authorization", string `Bearer ${accessToken}`);
    patchReq.setJsonPayload({
        "Operations": [{"op": "add", "value": {"members": [{"value": userId}]}}]
    });
    http:Response patchResp = check scimClient->patch(string `/Groups/${groupId}`, patchReq);
    if patchResp.statusCode >= 300 {
        return error(string `Asgardeo SCIM2 returned ${patchResp.statusCode}`);
    }
}
