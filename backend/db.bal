import ballerina/log;
import ballerina/sql;
import ballerina/time;
import ballerinax/mysql;

final mysql:Client dbClient = check new (
    host = dbHost,
    user = dbUser,
    password = dbPassword,
    database = dbName,
    port = dbPort,
    connectionPool = {maxOpenConnections: 10}
);

// ── Row types (match SQL column names exactly) ─────────────────────────────

type SystemRow record {|
    string id;
    string name;
    string description;
    string category;
    string asgardeo_group_id;
    int is_active;
    string created_at;
|};

type RequestRow record {|
    string id;
    string employee_id;
    string employee_name;
    string employee_email;
    string system_id;
    string system_name;
    string asgardeo_group_id;
    string justification;
    string status;
    string requested_at;
    string? reviewed_by;
    string? reviewed_at;
    string? review_comment;
|};

type AuditRow record {|
    int id;
    string action;
    string performed_by;
    string performed_by_email;
    string? target_id;
    string? details;
    string created_at;
|};

type SystemStatRow record {|
    string system_name;
    int pending;
    int approved;
    int rejected;
|};

type DayStatRow record {|
    string date;
    int cnt;
|};

type OverallStatRow record {|
    int total;
    int pending;
    int approved;
    int rejected;
|};

type CountRow record {|
    int cnt;
|};

// ── Converters ─────────────────────────────────────────────────────────────

function rowToRequest(RequestRow r) returns AccessRequest => {
    id: r.id,
    employeeId: r.employee_id,
    employeeName: r.employee_name,
    employeeEmail: r.employee_email,
    systemId: r.system_id,
    systemName: r.system_name,
    asgardeoGroupId: r.asgardeo_group_id,
    justification: r.justification,
    status: r.status,
    requestedAt: r.requested_at,
    reviewedBy: r.reviewed_by,
    reviewedAt: r.reviewed_at,
    reviewComment: r.review_comment
};

// ── Systems ────────────────────────────────────────────────────────────────

function dbGetSystems() returns SystemResource[]|error {
    SystemResource[] out = [];
    stream<SystemRow, sql:Error?> s = dbClient->query(
        `SELECT id, name, description, category, asgardeo_group_id, is_active, created_at
         FROM systems WHERE is_active = 1 ORDER BY category, name`
    );
    check from SystemRow r in s
        do { out.push({id: r.id, name: r.name, description: r.description, category: r.category, asgardeoGroupId: r.asgardeo_group_id}); };
    return out;
}

function dbGetAdminSystems() returns AdminSystem[]|error {
    AdminSystem[] out = [];
    stream<SystemRow, sql:Error?> s = dbClient->query(
        `SELECT id, name, description, category, asgardeo_group_id, is_active, created_at
         FROM systems ORDER BY category, name`
    );
    check from SystemRow r in s
        do { out.push({id: r.id, name: r.name, description: r.description, category: r.category, asgardeoGroupId: r.asgardeo_group_id, isActive: r.is_active == 1, createdAt: r.created_at}); };
    return out;
}

function dbFindSystem(string systemId) returns SystemResource|sql:Error|() {
    SystemRow|sql:Error result = dbClient->queryRow(
        `SELECT id, name, description, category, asgardeo_group_id, is_active, created_at
         FROM systems WHERE id = ${systemId} AND is_active = 1`
    );
    if result is sql:NoRowsError { return (); }
    if result is sql:Error { return result; }
    return {id: result.id, name: result.name, description: result.description, category: result.category, asgardeoGroupId: result.asgardeo_group_id};
}

function dbCreateSystem(string id, string name, string description, string category, string groupId) returns error? {
    string now = time:utcToString(time:utcNow());
    _ = check dbClient->execute(
        `INSERT INTO systems (id, name, description, category, asgardeo_group_id, is_active, created_at)
         VALUES (${id}, ${name}, ${description}, ${category}, ${groupId}, 1, ${now})`
    );
}

function dbUpdateSystem(string id, string name, string description, string category, string groupId) returns error? {
    sql:ExecutionResult r = check dbClient->execute(
        `UPDATE systems SET name=${name}, description=${description}, category=${category}, asgardeo_group_id=${groupId} WHERE id=${id}`
    );
    if r.affectedRowCount == 0 { return error("System not found"); }
}

function dbToggleSystem(string id, boolean active) returns error? {
    sql:ExecutionResult r = check dbClient->execute(
        `UPDATE systems SET is_active=${active ? 1 : 0} WHERE id=${id}`
    );
    if r.affectedRowCount == 0 { return error("System not found"); }
}

// ── Requests ───────────────────────────────────────────────────────────────

function dbGetRequests(string userId, boolean isManager) returns AccessRequest[]|error {
    AccessRequest[] out = [];
    stream<RequestRow, sql:Error?> s;
    if isManager {
        s = dbClient->query(
            `SELECT id, employee_id, employee_name, employee_email, system_id, system_name,
             asgardeo_group_id, justification, status, requested_at, reviewed_by, reviewed_at, review_comment
             FROM access_requests ORDER BY requested_at DESC`
        );
    } else {
        s = dbClient->query(
            `SELECT id, employee_id, employee_name, employee_email, system_id, system_name,
             asgardeo_group_id, justification, status, requested_at, reviewed_by, reviewed_at, review_comment
             FROM access_requests WHERE employee_id = ${userId} ORDER BY requested_at DESC`
        );
    }
    check from RequestRow r in s do { out.push(rowToRequest(r)); };
    return out;
}

function dbHasPendingRequest(string employeeId, string systemId) returns boolean|error {
    CountRow r = check dbClient->queryRow(
        `SELECT COUNT(*) as cnt FROM access_requests WHERE employee_id=${employeeId} AND system_id=${systemId} AND status='PENDING'`
    );
    return r.cnt > 0;
}

function dbCreateRequest(AccessRequest req) returns error? {
    _ = check dbClient->execute(
        `INSERT INTO access_requests (id, employee_id, employee_name, employee_email, system_id, system_name, asgardeo_group_id, justification, status, requested_at)
         VALUES (${req.id}, ${req.employeeId}, ${req.employeeName}, ${req.employeeEmail}, ${req.systemId}, ${req.systemName}, ${req.asgardeoGroupId}, ${req.justification}, ${req.status}, ${req.requestedAt})`
    );
}

function dbGetRequest(string id) returns AccessRequest|sql:Error|() {
    RequestRow|sql:Error result = dbClient->queryRow(
        `SELECT id, employee_id, employee_name, employee_email, system_id, system_name, asgardeo_group_id, justification, status, requested_at, reviewed_by, reviewed_at, review_comment
         FROM access_requests WHERE id = ${id}`
    );
    if result is sql:NoRowsError { return (); }
    if result is sql:Error { return result; }
    return rowToRequest(result);
}

function dbUpdateRequestStatus(string id, string status, string reviewedBy, string reviewedAt, string? comment) returns AccessRequest|error {
    _ = check dbClient->execute(
        `UPDATE access_requests SET status=${status}, reviewed_by=${reviewedBy}, reviewed_at=${reviewedAt}, review_comment=${comment} WHERE id=${id}`
    );
    AccessRequest|sql:Error|() updated = dbGetRequest(id);
    if updated is () { return error("Request disappeared after update"); }
    if updated is sql:Error { return updated; }
    return updated;
}

// ── Analytics ──────────────────────────────────────────────────────────────

function dbGetAnalytics() returns AnalyticsResponse|error {
    // Use COUNT(CASE WHEN...) — always returns int (BIGINT), avoids DECIMAL from SUM()
    OverallStatRow overall = check dbClient->queryRow(
        `SELECT COUNT(*) as total,
         COUNT(CASE WHEN status='PENDING' THEN 1 END) as pending,
         COUNT(CASE WHEN status='APPROVED' THEN 1 END) as approved,
         COUNT(CASE WHEN status='REJECTED' THEN 1 END) as rejected
         FROM access_requests`
    );

    SystemStat[] bySystem = [];
    stream<SystemStatRow, sql:Error?> sysStat = dbClient->query(
        `SELECT system_name,
         COUNT(CASE WHEN status='PENDING' THEN 1 END) as pending,
         COUNT(CASE WHEN status='APPROVED' THEN 1 END) as approved,
         COUNT(CASE WHEN status='REJECTED' THEN 1 END) as rejected
         FROM access_requests GROUP BY system_name ORDER BY system_name`
    );
    check from SystemStatRow r in sysStat
        do { bySystem.push({systemName: r.system_name, pending: r.pending, approved: r.approved, rejected: r.rejected}); };

    DayStat[] recent = [];
    stream<DayStatRow, sql:Error?> daysStat = dbClient->query(
        `SELECT LEFT(requested_at, 10) as date, COUNT(*) as cnt
         FROM access_requests GROUP BY LEFT(requested_at, 10) ORDER BY date DESC LIMIT 30`
    );
    check from DayStatRow r in daysStat
        do { recent.push({date: r.date, count: r.cnt}); };

    return {total: overall.total, pending: overall.pending, approved: overall.approved, rejected: overall.rejected, bySystem, recentActivity: recent};
}

// ── Audit log ──────────────────────────────────────────────────────────────

function dbLogAudit(string action, string performedBy, string performedByEmail, string? targetId, string? details) {
    string now = time:utcToString(time:utcNow());
    sql:ExecutionResult|sql:Error r = dbClient->execute(
        `INSERT INTO audit_log (action, performed_by, performed_by_email, target_id, details, created_at)
         VALUES (${action}, ${performedBy}, ${performedByEmail}, ${targetId}, ${details}, ${now})`
    );
    if r is sql:Error { log:printWarn("Audit log write failed: " + r.message()); }
}

function dbGetAuditLog(int limitCount) returns AuditEntry[]|error {
    AuditEntry[] out = [];
    stream<AuditRow, sql:Error?> s = dbClient->query(
        `SELECT id, action, performed_by, performed_by_email, target_id, details, created_at
         FROM audit_log ORDER BY id DESC LIMIT ${limitCount}`
    );
    check from AuditRow r in s
        do { out.push({id: r.id, action: r.action, performedBy: r.performed_by, performedByEmail: r.performed_by_email, targetId: r.target_id, details: r.details, createdAt: r.created_at}); };
    return out;
}
