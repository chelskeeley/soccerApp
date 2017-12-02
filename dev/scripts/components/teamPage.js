import React from 'react';
import GameModal from "./addGameModal.js";
import PlayerModal from "./addPlayerModal.js";
import LoginModal from "./loginModal.js";
import firebase from 'firebase';
import {
    BrowserRouter as Router,
    Route, Link, Switch, BrowserHistory
} from 'react-router-dom';
import Collapsible from 'react-collapsible';
import ManageTeam from './manageTeam.js';

class TeamPage extends React.Component {
    constructor() {
        super();
        this.state = {
            games: [],
            currentUserEmail: "",
            currentUserName: "",
            loggedIn: false,
            teamRoster: [],
            // oldRef: {},
        }
        this.goBack = this.goBack.bind(this);
        this.getCurrentUserEmail = this.getCurrentUserEmail.bind(this);
        this.displayUserName = this.displayUserName.bind(this);
        this.signOut = this.signOut.bind(this);
        this.getFullRoster = this.getFullRoster.bind(this);
        this.addToYes = this.addToYes.bind(this);
        this.moveFbRecord = this.moveFbRecord.bind(this);
    }
    
    goBack() {
		window.history.back();
	}
    
    //getting data from firebase to populate upcoming games
    componentDidMount() {
        const teamId = this.props.match.params.key;
        const dbRef = firebase.database().ref(teamId);

        
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.setState({
                    currentUserEmail: firebase.auth().currentUser.email,
                    loggedIn: true
                });
                this.displayUserName();
            } else {
                this.setState({
                    loggedIn: false,
                    currentUserEmail: '',
                    currentUserName: '',
                })
            }
        });

    
        dbRef.on("value", (firebaseData) => {
            const teamData = firebaseData.val();
            const gamesArray = [];
            const gameData = teamData.games;
            //console.log(teamData);
            for (let gameKey in gameData) {
                gameData[gameKey].key = gameKey;
                gamesArray.push(gameData[gameKey]);
                // console.log(teamsData[teamKey])
            }
            this.setState({
                games: gamesArray
            })
        })
        // this.displayUserName();
        this.getFullRoster();
    }
    getCurrentUserEmail(currentemail) {
        this.displayUserName();
        this.setState({
            currentUserEmail: email
        })
    }
    // Pull a full list of all members on the current team
    getFullRoster() {
        //console.log(this.props.match.params.key)
        const dbRefUsers = firebase.database().ref(`${this.props.match.params.key}/users`);
        //const dbRefUsers = firebase.database().ref(`${this.props.match.params.key}/users`);
        //console.log(dbRefUsers)
        dbRefUsers.on('value', (players) => {
            const teamArray = []
            for (let player in players.val()) {
                // console.log(players.val()[player].email, players.val()[player].name)
                const playerObj = {
                    name: players.val()[player].name,
                    email: players.val()[player].email
                }
                teamArray.push(playerObj)
            }
            this.setState({
                teamRoster: teamArray
            })
        })
    }

    

    displayUserName(){
        const teamId = this.props.match.params.key;
        const dbRef = firebase.database().ref(teamId);
        

        dbRef.on("value", (firebaseData) => {
            const teamData = firebaseData.val();
            const userData = teamData.users;
            let userName = "";

            
            for (let userKey in userData){
                if (this.state.currentUserEmail === userData[userKey].email){
                    userName = userData[userKey].name
                }
            }
            this.setState({
                currentUserName: userName
            })
        })
        // for (let userKey );
    }

    signOut(event) {
        event.preventDefault()
        firebase.auth().signOut();
    }

    //will also need to store in each button which game yes/no button they are clicking, tie the key for each game as a data value on each yes/no
    //pull a snapshot from firebase
    //the attendance lives in state...
    addToYes(gameKey){
        //find out who is signed in via email, should be currentuseremail in state
        console.log(this.state.currentUserEmail);
        console.log(gameKey);
        let dbRef = firebase.database().ref(`${this.props.match.params.key}/games/${gameKey}/attendance/pending`);
        console.log(dbRef)
        // let oldRef = '';
        
        
        dbRef.on("value", (firebaseData) => {
            const playerToMove = firebaseData.val();
            
            const movingArray = playerToMove.map((email,i)=>{
                return {eMail: email,
                        index: i}
            });
            console.log(playerToMove)
            console.log(movingArray)
            const movingPlayer = movingArray.filter((value)=>{
                return value['eMail'] === this.state.currentUserEmail;
            });
            console.log(movingPlayer)

            // firebase.database().ref(`${this.props.match.params.key}/games/${gameKey}/attendance/pending/${movingPlayer[0]['index']}/${movingPlayer[0]['eMail']}`).remove();

            // console.log(movingPlayer[0].eMail)

            let oldRef = firebase.database().ref(`${this.props.match.params.key}/games/${gameKey}/attendance/pending/${movingPlayer[0]['index']}`)
            
            let newRef = firebase.database().ref(`${this.props.match.params.key}/games/${gameKey}/attendance/yes`);

            // newRef.push(movingPlayer[0]['eMail'])

            this.moveFbRecord(oldRef, newRef)

        })

    }

    moveFbRecord(oldRef, newRef) {
    oldRef.once('value', function (snap) {
        newRef.push(snap.val(), function (error) {
            if (!error) { oldRef.remove(); }
            else if (typeof (console) !== 'undefined' && console.error) { console.error(error); }
        });
    });
}



    render(){
        let logInOrOut = '';
        let addGame = '';
        let manageTeam = '';
        let welcomeMessage = '';
        if (this.state.loggedIn == false){
            logInOrOut = (
                <LoginModal getCurrentUserEmail={ this.getCurrentUserEmail} teamKey={this.props.match.params.key}/>

            )
        } else {
            logInOrOut = (
                <button onClick={this.signOut}>Log Out</button>
            )
        }
        if (this.state.currentUserName === ''){
            addGame = (
                <p>NO YOU CANT ADD GAMES</p>
            )
            manageTeam = (
                <p>NO YOU CANT MANAGE THE TEAM</p>
            )
            welcomeMessage = (
                <p></p>
            )
        } else {
            addGame = (
                <GameModal teamKey={this.props.match.params.key} />
            )
            manageTeam = (
                <Link to={`/${this.props.match.params.team}/${this.props.match.params.key}/manageTeam`}>
                    <p>Manage Team</p>
                </Link>
            )
            welcomeMessage = (
                <p>Welcome {this.state.currentUserName}</p>
            )
        }
        
        return (
            <div>
                {logInOrOut}
                {addGame}
                <div>
                    <button onClick={this.goBack}>Back</button>
                </div>
                <h2>{this.props.match.params.team}</h2>
                {welcomeMessage}
                {manageTeam}
                <section>
                    <h3>Upcoming Games</h3>
                    <div className="fullSchedule">
                        {this.state.games.map((game, i) => {
                        const pendingArray = [];
                        console.log(game)
                        //console.log(game.attendance.pending)
                        for (let player in game.attendance.pending) {
                            pendingArray.push(game.attendance.pending[player])
                        }
                        // console.log(game)
                        const pendingNamesArray = [];

                        this.state.teamRoster.forEach((player) => {
                            // console.log(player, 'teamroster player')
                            pendingArray.forEach((playerPendingEmail) => {
                                // console.log(playerPendingEmail)
                                if (playerPendingEmail === player.email) {
                                    // console.log('DA TROOF')
                                    pendingNamesArray.push(player.name)
                                } else {
                                    // console.log('boo urns')
                                }
                            })
                        })
                            return (
                                <div>
                                    <Collapsible gameKey={game.key} trigger={`${game.date} vs ${game.opponent}`}>
                                        <div className="container">
                                            <div>
                                                <h4>Location</h4>
                                                <p>{game.location}</p>
                                                <h4>Time</h4>
                                                <p>{game.time}</p>
                                            </div>
                                            <div className="attendence">
                                                <p>Going: TBA</p>
                                                <p>Gents: TBA</p>
                                                <p>Ladies: TBA</p>
                                                <p>Can't make it</p>
                                            </div>
                                            <div className="yes">
                                                <ul>
                                                    <li>TBA</li>
                                                </ul>
                                            </div>
                                            <div className="no">
                                                <ul>
                                                    <li>TBA</li>
                                                </ul>
                                            </div>
                                            <div className="Pending">
                                                <h4>pending:</h4>
                                                <ul>
                                                    {pendingNamesArray.map((player) => {
                                                        return <li>{player}</li>
                                                    })}
                                                </ul>
                                            </div>
                                            <button>We Need Subs</button>

                                        </div>
                                    </Collapsible>
                                    {/* {response} */}
                                    {this.state.loggedIn
                                    ? (<div className="rsvp">
                                        <button onClick={() => this.addToYes(game.key)} >Yes</button>
                                        <button>No</button>
                                        <p>You said TBA</p>
                                        </div>)
                                            
                                    : (<div></div>)
                                            
                                    
                                    }
                                </div>
                            )
                        })}
                    </div>
                </section>
            </div>   
        )
    }
}

export default TeamPage