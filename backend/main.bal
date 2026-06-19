import ballerina/http;

configurable string asgardeoOrg = "hesara";
configurable string clientId = ?;
configurable string clientSecret = ?;

type User record {
    string name;
    int age;
    int id;
};

map<int> userIds = {};

@http:ServiceConfig {
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
service /users on new http:Listener(8080) {
    resource function post addUser(@http:Payload User user) returns http:Response {
        userIds[user.id.toString()] = user.id;
        http:Response res = new;
        res.setPayload("User added successfully");
        return res;
    }

    resource function get getUser(int id) returns http:Response {
        if userIds.hasKey(id.toString()) {
            http:Response res = new;
            res.setPayload("User found with ID: " + id.toString());
            return res;
        }
        http:Response res = new;
        res.statusCode = 404;
        res.setPayload("User not found");
        return res;
    }

    resource function delete deleteUser(int id) returns http:Response {
        if userIds.hasKey(id.toString()) {
            _ = userIds.remove(id.toString());
            http:Response res = new;
            res.setPayload("User deleted with ID: " + id.toString());
            return res;
        }
        http:Response res = new;
        res.statusCode = 404;
        res.setPayload("User not found");
        return res;
    }

    resource function put updateUser(@http:Payload User user) returns http:Response {
        if userIds.hasKey(user.id.toString()) {
            userIds[user.id.toString()] = user.id;
            http:Response res = new;
            res.setPayload("User updated successfully");
            return res;
        }
        http:Response res = new;
        res.statusCode = 404;
        res.setPayload("User not found");
        return res;
    }
}
