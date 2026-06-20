import ballerina/http;
import ballerina/jwt;
import ballerina/log;
import ballerina/time;
import ballerina/uuid;

configurable string asgardeoOrg = "hesara";
configurable string clientId = ?;
configurable string clientSecret = ?;
configurable string mgmtClientId = "";
configurable string mgmtClientSecret = "";
configurable string[] managerEmails = [];

type SystemResource record {|
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

map<AccessRequest> requestStore = {};

final SystemResource[] SYSTEMS = [
    {id: "dev-tools", name: "Developer Tools", description: "GitHub, Jira, CI/CD pipelines and code review tools", category: "Engineering", asgardeoGroupId: "PLACEHOLDER_GROUP_DEV"},
    {id: "hr-system", name: "HR System", description: "Employee records, payroll data and leave management", category: "Human Resources", asgardeoGroupId: "PLACEHOLDER_GROUP_HR"},
    {id: "finance", name: "Finance System", description: "Financial reports, budgets and expense tracking", category: "Finance", asgardeoGroupId: "PLACEHOLDER_GROUP_FINANCE"},
    {id: "crm", name: "CRM Platform", description: "Customer records, sales pipeline and client interactions", category: "Sales", asgardeoGroupId: "PLACEHOLDER_GROUP_CRM"},
    {id: "analytics", name: "Analytics Dashboard", description: "Business intelligence, reporting and data visualisation", category: "Data", asgardeoGroupId: "PLACEHOLDER_GROUP_ANALYTICS"},
    {id: "infra", name: "Cloud Infrastructure", description: "AWS/Azure console, Kubernetes and deployment access", category: "Engineering", asgardeoGroupId: "PLACEHOLDER_GROUP_INFRA"}
];

@http:ServiceConfig {
    cors: {
        allowOrigins: ["http://localhost:3000"],
        allowCredentials: false,
        allowHeaders: ["Authorization", "Content-Type", "x-jwt-assertion"],
        allowMethods: ["GET", "POST", "PUT", "OPTIONS"]
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

    resource function get profile(http:Request req) returns json|http:InternalServerError {
        UserContext|error ctx = extractUserContext(req);
        if ctx is error {
            return <http:InternalServerError>{body: ctx.message()};
        }
        return {userId: ctx.userId, userName: ctx.userName, userEmail: ctx.userEmail, isManager: ctx.isManager};
    }

    resource function get systems() returns SystemResource[] {
        return SYSTEMS;
    }

    resource function post requests(http:Request req, @http:Payload NewRequestPayload body)
            returns AccessRequest|http:BadRequest|http:NotFound|http:InternalServerError {

        UserContext|error ctx = extractUserContext(req);
        if ctx is error {
            return <http:InternalServerError>{body: ctx.message()};
        }

        SystemResource? targetSystem = findSystem(body.systemId);
        if targetSystem is () {
            return <http:NotFound>{body: string `System '${body.systemId}' not found`};
        }

        foreach string key in requestStore.keys() {
            AccessRequest r = requestStore.get(key);
            if r.employeeId == ctx.userId && r.systemId == body.systemId && r.status == "PENDING" {
                return <http:BadRequest>{body: "You already have a pending request for this system"};
            }
        }

        string id = uuid:createType4AsString();
        AccessRequest newReq = {
            id: id,
            employeeId: ctx.userId,
            employeeName: ctx.userName,
            employeeEmail: ctx.userEmail,
            systemId: body.systemId,
            systemName: targetSystem.name,
            asgardeoGroupId: targetSystem.asgardeoGroupId,
            justification: body.justification,
            status: "PENDING",
            requestedAt: time:utcToString(time:utcNow())
        };
        requestStore[id] = newReq;
        return newReq;
    }

    resource function get requests(http:Request req) returns AccessRequest[]|http:InternalServerError {
        UserContext|error ctx = extractUserContext(req);
        if ctx is error {
            return <http:InternalServerError>{body: ctx.message()};
        }

        AccessRequest[] result = [];
        foreach string key in requestStore.keys() {
            AccessRequest r = requestStore.get(key);
            if ctx.isManager || r.employeeId == ctx.userId {
                result.push(r);
            }
        }
        return result;
    }

    resource function put requests/[string id]/approve(http:Request req, @http:Payload ReviewPayload body)
            returns AccessRequest|http:NotFound|http:BadRequest|http:Forbidden|http:InternalServerError {

        UserContext|error ctx = extractUserContext(req);
        if ctx is error {
            return <http:InternalServerError>{body: ctx.message()};
        }
        if !ctx.isManager {
            return <http:Forbidden>{body: "Only managers can approve requests"};
        }
        if !requestStore.hasKey(id) {
            return <http:NotFound>{body: string `Request '${id}' not found`};
        }

        AccessRequest existing = requestStore.get(id);
        if existing.status != "PENDING" {
            return <http:BadRequest>{body: "Request is not pending"};
        }

        if mgmtClientId != "" && mgmtClientSecret != "" {
            error? groupResult = addUserToAsgardeoGroup(existing.asgardeoGroupId, existing.employeeId);
            if groupResult is error {
                log:printWarn("Asgardeo group update skipped: " + groupResult.message());
            }
        }

        AccessRequest updated = {
            ...existing,
            status: "APPROVED",
            reviewedBy: ctx.userName,
            reviewedAt: time:utcToString(time:utcNow()),
            reviewComment: body.comment == "" ? () : body.comment
        };
        requestStore[id] = updated;
        return updated;
    }

    resource function put requests/[string id]/reject(http:Request req, @http:Payload ReviewPayload body)
            returns AccessRequest|http:NotFound|http:BadRequest|http:Forbidden|http:InternalServerError {

        UserContext|error ctx = extractUserContext(req);
        if ctx is error {
            return <http:InternalServerError>{body: ctx.message()};
        }
        if !ctx.isManager {
            return <http:Forbidden>{body: "Only managers can reject requests"};
        }
        if !requestStore.hasKey(id) {
            return <http:NotFound>{body: string `Request '${id}' not found`};
        }

        AccessRequest existing = requestStore.get(id);
        if existing.status != "PENDING" {
            return <http:BadRequest>{body: "Request is not pending"};
        }

        AccessRequest updated = {
            ...existing,
            status: "REJECTED",
            reviewedBy: ctx.userName,
            reviewedAt: time:utcToString(time:utcNow()),
            reviewComment: body.comment == "" ? () : body.comment
        };
        requestStore[id] = updated;
        return updated;
    }
}

function extractUserContext(http:Request req) returns UserContext|error {
    string token = "";

    // Choreo/WSO2 sends the JWT in x-jwt-assertion; fall back to Authorization header
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

    map<json>? claims = payload.customClaims;
    if claims is map<json> {
        json emailJson = claims["email"] ?: "";
        json nameJson = claims["username"] ?: claims["preferred_username"] ?: "";
        userEmail = emailJson.toString();
        string nameStr = nameJson.toString();
        if nameStr != "" {
            userName = nameStr;
        }

        json rolesJson = claims["roles"] ?: [];
        if rolesJson is json[] {
            foreach json role in rolesJson {
                string roleStr = role.toString().toLowerAscii();
                if roleStr == "manager" || roleStr == "admin" {
                    isManager = true;
                }
            }
        }

        json groupsJson = claims["groups"] ?: [];
        if !isManager && groupsJson is json[] {
            foreach json grp in groupsJson {
                string grpStr = grp.toString().toLowerAscii();
                if grpStr.includes("manager") || grpStr.includes("admin") {
                    isManager = true;
                }
            }
        }
    }

    // Fallback: configurable manager email list
    if !isManager {
        foreach string email in managerEmails {
            if email == userEmail {
                isManager = true;
                break;
            }
        }
    }

    return {userId, userName, userEmail, isManager};
}

function findSystem(string systemId) returns SystemResource? {
    foreach SystemResource sys in SYSTEMS {
        if sys.id == systemId {
            return sys;
        }
    }
    return ();
}

function addUserToAsgardeoGroup(string groupId, string userId) returns error? {
    http:Client tokenClient = check new(string `https://api.asgardeo.io/t/${asgardeoOrg}/oauth2/token`);
    http:Request tokenReq = new;
    tokenReq.setTextPayload(
        string `grant_type=client_credentials&client_id=${mgmtClientId}&client_secret=${mgmtClientSecret}&scope=internal_group_mgt_update`,
        contentType = "application/x-www-form-urlencoded"
    );
    http:Response tokenResp = check tokenClient->post("", tokenReq);
    json tokenBody = check tokenResp.getJsonPayload();
    json accessTokenJson = check tokenBody.access_token;
    string accessToken = accessTokenJson.toString();

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
