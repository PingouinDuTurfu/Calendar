import { logger } from "./components/Logger.js";
import { currentSession } from "./script.js";
import {appSetup} from "./app-setup.js";

const defaultUiConfig = {
    signInOptions: [
        firebase.auth.EmailAuthProvider.PROVIDER_ID
    ]
};


function login(signInSuccessUrl = "/") {
    const uiConfig = defaultUiConfig;
    uiConfig['signInSuccessUrl'] = signInSuccessUrl;
    const loginBoxContainer = $('.login-box-container');
    loginBoxContainer.css('display', 'flex');
    var ui;
    if (firebaseui.auth.AuthUI.getInstance())
        ui = firebaseui.auth.AuthUI.getInstance();
    else
        ui = new firebaseui.auth.AuthUI(firebase.auth());

    loginBoxContainer.show();
    $('.sign-out-button').hide();
    ui.start('#firebase-auth-container', uiConfig);
}

appSetup.done(() => {
    firebase.auth().onAuthStateChanged(function(user) {
        logger.log("User changed to " + (user ? user.uid : "null"));
        if(user) {
            $('#login-button').hide();
            $('#sign-out-button').show();
            user.getIdToken().then(function(token) {
                Cookies.set('token', token, { expires: 1/24}, { path: '/' });
            });
            currentSession.createSession();
            currentSession.buildNotificationsBox();
            currentSession.updateWeek();
        } else {
            $('#login-button').show();
            $('#sign-out-button').hide();
            Cookies.remove('token', { path: '/' });
        }
    }, function(error) {
        $('.messages-container').append("<div class='error-message'>" + error + "</div>");
    });

    logger.log("Login started");
    $('#login-button').click(function() {
        const user = firebase.auth().currentUser;
        if(!user)
            login();
    });

    $('#sign-out-button').click(function() {
        firebase.auth().signOut();
        currentSession.destroy();
    });
});