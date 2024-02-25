const express = require('express');

const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const opn = require('opn');

const fs = require('fs');
const readline = require('readline');

const app = express();
app.use(express.json());

const { values } = require('./config.js');
const { file } = require('googleapis/build/src/apis/file/index.js');
const { json } = require('express');
const { oauth2 } = require('googleapis/build/src/apis/oauth2/index.js');

app.get('/oAuth2Callback', async (req, res) => {
    const oAuth2Client = new google.auth.OAuth2(
        values.client_id,
        values.client_secret,
        values.redirect_uris[0]
    );

    const { code, scope } = req.query;

    // Get the auth tokens from google for usage, since we can't use the code as it is short lived and we can only use the auth-code for access to user information 
    try {
        const { tokens } = await oAuth2Client.getToken(code);
        fs.writeFileSync('tokens.json', JSON.stringify(tokens)); // write tokens to a file for later use 
        res.json({
            success: true,
            msg: 'Login successful!'
        })
    } catch (error) {
        console.log({ error });
        res.status(500).json({ success: false, msg: "An error occured, Please try again!" });
    }
});

app.get('/authenticate', async (req, res) => {
    const oAuth2Client = new google.auth.OAuth2(
        values.client_id,
        values.client_secret,
        values.redirect_uris[0]
    );

    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: values.scopes,
    });

    await opn(authUrl);

    res.send('Authentication started. Please check your browser.');
});

const fileExists = (path) => {
    return fs.existsSync(path);
}

const getFileContent = (path) => {
    if (!fileExists(path))
        return {
            success: false,
            msg: 'No such file found!'
        }

    try {
        const fileContent = fs.readFileSync(path, 'utf-8');
        if (fileContent && fileContent !== undefined && fileContent.trim() !== '') {
            return {
                success: true,
                status: 'read_success',
                msg: 'File Read successfully',
                content: fileContent
            }
        }
        else {
            return {
                success: false,
                status: 'content_error',
                msg: 'Empty file found!',
                content: {}
            }
        }
    } catch (error) {
        return {
            success: false,
            status: 'read_error',
            msg: error.message,
            content: {}
        }
    }

}

const parseJson = (content) => {
    try {
        const jsonContent = JSON.parse(content);
        return {
            success: true,
            msg: 'Content parsed to JSON!',
            content: jsonContent
        }
    }
    catch (error) {
        return {
            success: false,
            msg: error.message,
            content: {},
            status: 'parse_error'
        }
    }
}
const refreshAccessToken = async(tokens) => {
    console.log('Refreshing access tokens')
    const oAuth2Client = new google.auth.OAuth2(
        values.client_id,
        values.client_secret,
        values.redirect_uris[0]
    );
    oAuth2Client.credentials = tokens ; 
    console.log(oAuth2Client)
    
}


const getAuthTokens = async () => {
    try {
        const file = getFileContent('tokens.json');
        const response = parseJson(file.content);
        if (!response.success) {
            console.log({msg : response.msg, status : response.status});
            return {
                status: 'error', tokens: null, msg : response.msg
            }
        }
        const tokens = response.content; 
        const { auth_token, refresh_token, expiry_date } = tokens; 
        // check for expiry date of auth token 
        const expiryTime = new Date(expiry_date), currentTime = new Date();
        const validUpto = Math.floor((expiryTime.getTime() - currentTime.getTime()) / 60000);
        console.log(`Token is valid for ${validUpto} minutes.`);
        // Request new token
        if (validUpto <= 50){
            refreshAccessToken(tokens); 
        }
        console.log(`Token is valid for ${validUpto} minutes.`);
        return { status: 'found', tokens };

    } catch (error) {
        // console.log({ msg: "Error Reading the file", error })
        // handle the parsing error 
        return { status: 'error', tokens: null };
    }
}


const tokens = getAuthTokens();
app.get('/drive', async (req, res) => {
    const tokenResponse = getAuthTokens();
    if (tokenResponse.status === 'error')
        return res.status(500).json({ success: false, msg: 'An error occured!' });
    else if (tokenResponse.status === 'not-logged')
        return res.status(403).json({ success: false, msg: 'Please try logging in!' });


})


app.post('/curl-check', async (req, res) => {
    console.log(req.rawBody);

    console.log({ response: req.body });

    res.status(200).json({
        response: req.body,
    })
})

app.get('/start', (req, res) => {
    const fileContent = getFileContent('tokens.json'); 
    return res.json({
        fileContent
    })
})



app.listen(values.PORT, () => console.log('Server is running at port : ', values.PORT)); 
