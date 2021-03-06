'use strict';

let app = require('../../app');
let request = require('supertest');

let MongoDB = require('../../persistence/mongodb');
let db;
const { ObjectID, ObjectId } = require('bson');

let users, tokens, messages;
let user1ID, user2ID, user3ID;
let msg1ID, msg2ID;


let user1 = {username: "user1", password: "123"}
let user2 = {username: "user2", password: "456"}
let user3 = {username: "user3", password: "789"}

let message1 = {
    sender : ObjectID(),
    receiver : ObjectID(),
    timestamp : Date.now(),
    message : "HELLO!" 
};

let message2 = {
    sender : ObjectID(),
    receiver : ObjectID(),
    timestamp : Date.now(),
    message : "Hola! " 
}

//logged in
let token1 = {token: "user1_token", userID: ObjectID(), expires: 9999999999999}

//not logged in
let token2 = {token: "user2_token", userID: ObjectID(), expires: 0}

let token3 = {token: "user3_token", userID: ObjectID(), expires: 99}


beforeAll(async () => {
    if (!db) db = await MongoDB.open();

    jest.setTimeout(10000);
    //create collections
    users = db.collection("users");
    tokens = db.collection("tokens");
    messages = db.collection('messages');

    //set up DB with mock data
    await seedDB();
});

async function seedDB() {

    //user1,token 1,
    let user1Inserted = await users.insertOne(user1);
    user1ID = ObjectId(user1Inserted.insertedId);

    token1.userID = user1ID;
    let token1Inserted = await tokens.insertOne(token1)

    //user2,token 2,
    let user2Inserted = await users.insertOne(user2);
    user2ID = ObjectId(user2Inserted.insertedId);

    token2.userID = user2ID;
    let token2Inserted = await tokens.insertOne(token2);

    message1.receiver = user1ID;
    message1.sender = user2ID;

    message2.receiver = user2ID;
    message2.sender = user1ID;

    let msg1Inserted = await messages.insertOne(message1);
    msg1ID = msg1Inserted.insertedId;

    let msg2Inserted = await messages.insertOne(message2);
    msg2ID = msg2Inserted.insertedId;

    //user3,token 3,
    let user3Inserted = await users.insertOne(user3);
    user3ID = ObjectId(user3Inserted.insertedId);

    token3.userID = user3ID;
    let token3Inserted = await tokens.insertOne(token3)
    
}

afterAll(async () => {
    // this is important to do, otherwise the db client remains open and tests never exit
    if (db) {
        await MongoDB.close();
        db = null;
    }
})

describe('Test Getting Chats', () => {
    test('User 1 logged in and can fetch messages', (done) => {
        return request(app).get('/messages/listChatMessages')
        .set('Cookie', '')//clear cookie and reset
        .set('Cookie', 'token=user1_token')
        .query({ userID1 : user1ID.toHexString() , userID2 : user2ID.toHexString()})
        .expect('[{"_id":"' + msg2ID.toHexString() + '","sender":"' + user1ID.toHexString() + '","receiver":"' + user2ID.toHexString() + '","timestamp":' + message2.timestamp +',"message":"' + message2.message +'"},{"_id":"' + msg1ID.toHexString() + '","sender":"' + user2ID.toHexString() + '","receiver":"' + user1ID.toHexString() + '","timestamp":' + message2.timestamp + ',"message":"' + message1.message +'"}]')
        .expect(200).end(done);
    });

    test('User 1 logged in but no messages found between user1 and user3', (done) => {
        return request(app).get('/messages/listChatMessages')
        .set('Cookie', '')//clear cookie and reset
        .set('Cookie', 'token=user1_token')     //logged in as user1
        .query({ userID1 : user1ID.toHexString() , userID2 : user3ID.toHexString()})
        .expect(404).end(done);
    });

    test('User 2 session expired and therefore cannot fetch chat', (done) => {
        return request(app).get('/messages/listChatMessages')
        .set('Cookie', '')//clear cookie and reset
        .set('Cookie', 'token=user2_token')     //logged in as user 2 but expired session
        .query({ userID1 : user1ID.toHexString() , userID2 : user2ID.toHexString()})
        .expect(401).end(done);
    });
});