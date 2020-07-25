import open from "open";
import readline from "readline";
import http from 'http';
import https from 'https';
import IAuthorizationResult from "./IAuthorizationResult";
import { v4 as uuidv4 } from "uuid";
import url from "url";
import fs from "fs";
import path from "path";

class Authorizer {
    private readonly _createAnIssueText = "If this problem persists, create an issue: https://github.com/RSGTechSupport/RSGBot/issues/new/choose";
    private readonly _scope = "creddits%20modcontributors%20modmail%20modconfig%20subscribe%20structuredstyles%20vote%20wikiedit%20mysubreddits%20submit%20modlog%20modposts%20modflair%20save%20modothers%20read%20privatemessages%20report%20identity%20livemanage%20account%20modtraffic%20wikiread%20edit%20modwiki%20modself%20history%20flair";
    private readonly _createAppUrl = "https://ssl.reddit.com/prefs/apps/";
    private readonly _redirectUri = "http://127.0.0.1:8080/authorize_callback";
    private _server: http.Server;
    private _reader: readline.Interface;
    private _guid: string;
    private _tokenJson: string;
    private _clientID: string;
    private _clientSecret: string;
    private _refreshToken: string;
    private _authorizationResolve: (result: IAuthorizationResult) => void;
    private _firstRequest: boolean = true;

    public async start(): Promise<IAuthorizationResult> {
        // Setup
        const promise = new Promise<IAuthorizationResult>((resolve) => this._authorizationResolve = resolve);
        this.setup();

        // Start auth
        console.log(`Starting authorization...\n`);

        // Step 1 - Log in
        await this.question("1. Log in to Reddit in your browser. Press enter when done.");

        // Step 2 - Create app
        await open(this._createAppUrl);
        await this.question(`2. Create a Reddit app:
        
    - (Should occur automatically) Navigate to ${this._createAppUrl}
        - Click "create another app"
        - Name: enter anything
        - Type: select "web app"
        - Description: leave blank
        - About url: leave blank
        - Redirect uri: enter "${this._redirectUri}"
        - Click "create app"
        
Press enter when done.`);

        // Step 3 - Enter client ID
        this._clientID = await this.question("3. Enter your app's ID (listed under your app's name and the type): ");

        // Step 4 - Enter client secret
        this._clientSecret = await this.question("4. Enter your app's secret (listed under your app's ID): ");

        // Step 5 - Authorize
        const authUrl = this.createAuthUrl(this._clientID);

        await open(authUrl);
        await this.question(`5. Authorize:

    - (Should occur automatically) Navigate to ${authUrl}
    - Click "Allow"

Your browser should display a success message. Press any key to start your bot.`);

        this._reader.close();

        return promise;
    }

    private setup(): void {
        // Reads command line input
        this._reader = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // Guid for oauth
        this._guid = uuidv4();

        // On auth, reddit redirects to redirect uri with tokens attached as query parameters
        this._server = http.createServer(this.requestListener);
        this._server.on('error', (error: Error) => {
            if (error.message.indexOf('EADDRINUSE')) {
                throw new Error(`Port 8080 is in use. ${this._createAnIssueText}.`);
            }
        });
        this._server.listen(8080, 'localhost');

        // Used to accumulate post request response body
        this._tokenJson = '';
    }

    private requestListener = (request: http.IncomingMessage, response: http.ServerResponse) => {
        // On second request, kill server
        if (!this._firstRequest) { // The post request redirects to the redirect uri again
            this._server.close();
            return;
        }
        this._firstRequest = false;

        // Handle response
        if (request.url == null) { // url.parse doesn't accept undefined as its first parameter. authorizationRequest.url has type string|undefined
            throw new Error(`Callback missing query parameters. ${this._createAnIssueText}.`);
        }

        const queryParameters = url.parse(request.url, true).query;

        if (queryParameters.error != null) {
            throw new Error(`Authorization error: ${queryParameters.error}. ${this._createAnIssueText}.`);
        }

        if (queryParameters.state !== this._guid) {
            throw new Error(`Invalid callback state. ${this._createAnIssueText}.`);
        }

        // Request access token
        const authorizationHeaderValue = Buffer.from(`${this._clientID}:${this._clientSecret}`, 'utf-8').toString('base64');
        const tokenRequestData = `grant_type=authorization_code&code=${queryParameters.code}&redirect_uri=${this._redirectUri}`;
        const tokenRequestOptions = {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authorizationHeaderValue}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(tokenRequestData)
            }
        };
        const tokenRequestListener = (tokenResponse: http.IncomingMessage) => {
            tokenResponse.
                on('data', (chunk) => this._tokenJson += chunk).
                on("end", () => {
                    const tokens = JSON.parse(this._tokenJson);

                    this._refreshToken = tokens['refresh_token'];

                    if (this._refreshToken == null) {
                        throw new Error(`Invalid refresh token. ${this._createAnIssueText}.`);
                    }

                    // Write variables.env for future use
                    fs.writeFileSync(path.join(__dirname, "../variables.env"), `CLIENT_ID=${this._clientID}
CLIENT_SECRET=${this._clientSecret}
REFRESH_TOKEN=${this._refreshToken}`);

                    // Write to web page
                    response.end(`Success!

Your secrets have been written to <project root>/variables.env for future logins.
By default, .gitignore is configured so git ignores variables.env (file won't be added to the repository).`);

                    this._authorizationResolve({ clientID: this._clientID, clientSecret: this._clientSecret, refreshToken: this._refreshToken });
                });
        }
        const tokenRequest = https.request('https://www.reddit.com/api/v1/access_token', tokenRequestOptions, tokenRequestListener);
        tokenRequest.on('error', (error) => {
            throw new Error(`Access token retrieval error: ${error}. ${this._createAnIssueText}.`);
        })
        tokenRequest.write(tokenRequestData)
        tokenRequest.end();
    }

    private question(question: string): Promise<string> {
        return new Promise(resolve => this._reader.question(question, (answer: string) => resolve(answer)));
    }

    private createAuthUrl(clientID: string): string {
        return `https://www.reddit.com/api/v1/authorize?client_id=${clientID}&response_type=code&duration=permanent&state=${this._guid}&redirect_uri=${this._redirectUri}&scope=${this._scope}`;
    }
}

export default new Authorizer();