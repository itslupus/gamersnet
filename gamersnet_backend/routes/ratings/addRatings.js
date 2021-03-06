'use strict';

// include our function from the database to add post
let {addRatingsDB} = require('../../persistence/ratings');
let {verifyUserLoggedIn} = require('../utilities/tokenUtility')

let {getTokenDocument} = require('../../persistence/tokens.js')
const { ObjectID } = require('bson');

// this function handles the /ratings/addRatings/ endpoint
//pass in the userID of the profile in the query and the ratings in the body of request
async function addRatings(request, response) {
    let body = request.body;
    let queryUserID = request.query.userID;
    let cookie = request.headers.cookie;
    let verifyBody = queryUserID && body.strength && body.punctuality && body.friendliness && body.fun && (body.playAgain !== undefined);
    let userID = ObjectID(queryUserID);

    let loggedIn = false;

    if (cookie) {
        cookie = cookie.split('=')[1];
        loggedIn = await verifyUserLoggedIn(cookie);
    }

    if (loggedIn && verifyBody) {
        let tokenDocument = await getTokenDocument(cookie);
        let raterID = tokenDocument.userID;

        // users can't rate their own profiles.
        if(!raterID.equals(userID)) {
            let result = await addRatingsDB(userID, raterID, body.strength, body.punctuality, body.friendliness, body.fun, body.playAgain, body.comment);

            // response.json(result); //leaving this here in case you want to return the updated document(or for old version change returnOriginal to true in ratings.js)
                                        //also need to return status 200 for returning json
            //console.log(result);

            response.status(201).end();
        } 
        else {
            response.status(401).end('You cannot rate your own profile.');
        }          
    } 
    else {
        if(!loggedIn)
            response.status(401).end('User not logged in. Log in to rate a profile.');
        else
            response.status(400).end();
    }
}

module.exports = {addRatings};