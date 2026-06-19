import ballerina/http;

type User record {
    string name;
    int age;
    int id;
};

map<int> userIds = {};

// Replace <org-name> and <client-id> with your Asgardeo organization and app values.
@http:ServiceConfig {
    auth: [
        {
            jwtValidatorConfig: {
                issuer: "https://api.asgardeo.io/t/<org-name>/oauth2/token",
                audience: "<your-client-id>",
                signatureConfig: {
                    jwksConfig: {
                        url: "https://api.asgardeo.io/t/<org-name>/oauth2/jwks"
                    }
                }
            }
        }
    ]
}
service /users on new http:Listener(8080) {
    resource function post addUser(@http:Payload User user) returns http:Response {
        userIds[user.id] = user.id;
        http:Response res = new;
        res.setPayload("User added successfully");
        return res;
    }

    resource function get getUser(int id) returns http:Response {
        if userIds.hasKey(id) {
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
        if userIds.hasKey(id) {
            userIds.remove(id);
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
        if userIds.hasKey(user.id) {
            userIds[user.id] = user.id;
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
