const moment = require('moment-timezone');

module.exports = 
{

  name: "NCAAF",

  teamsToFollow:[],

  configure: function(config) {
    this.teamsToFollow = config.teams;
  },

  getUrl: function(date) {

    var url = "http://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?dates=" + 
      moment(date).format("YYYYMMDD") + "&limit=100";

    return url;
  },

  formatQuarter: function(q) {
    switch (q) {
      case 1:
        return q + "<sup>ST</sup>";
      case 2:
        return q + "<sup>ND</sup>";
      case "H":
        return "HALFTIME";
      case 3:
        return q + "<sup>RD</sup>";
      case 4:
        return q + "<sup>TH</sup>";
      case 5:
      case "OT":
        return "OT";
      default:
        return q;
    }
  },  

  processData: function(data) {

    //expects JSON
    data = JSON.parse(data);

    var self = this;
    var formattedGamesList = new Array();
    var localTZ = moment.tz.guess();

    //filter to teams in this.teamsToFollow
    var filteredGamesList = data.events.filter(function(game) {
      return self.teamsToFollow.indexOf(game.competitions[0].competitors[0].team.abbreviation) != -1 || self.teamsToFollow.indexOf(game.competitions[0].competitors[1].team.abbreviation) != -1;
    });

    //iterate through games and construct formattedGamesList
    filteredGamesList.forEach(function(game) {

      var status = [];
      var classes = [];

      var gameState = 0;

      switch (game.status.type.id) {
        case "1": //scheduled
          gameState = 0;
          status.push(moment(game.competitions[0].date).tz(localTZ).format("h:mm a"));
          break;
        case "2": //guessing this is in-progress
          gameState = 1;
          status.push(game.status.displayClock);
          status.push(self.formatQuarter(game.status.period));
          break;
        case "3": //final
          gameState = 2;
          status.push("FINAL");
          break;
      }


      var hTeamData = game.competitions[0].competitors[0];
      var vTeamData = game.competitions[0].competitors[1];

      /*
        Looks like the home team is always the first in the feed, but it also specifies,
        so we can be sure.
      */
      if (hTeamData.homeAway == "away") {
        hTeamData = game.competitions[0].competitors[1];
        vTeamData = game.competitions[0].competitors[0];
      }

      formattedGamesList.push({
        gameMode: gameState,
        classes: classes,
        hTeam: hTeamData.team.abbreviation,
        vTeam: vTeamData.team.abbreviation,
        /*
          Normally we'd just use the team nickname (e.g.: "Bulls") but because there
          are so many teams in the leagues, I'm combining the abberviation and the
          team name together for the long team display names.
        */
        hTeamLong: hTeamData.team.abbreviation + " " + hTeamData.team.shortDisplayName,
        vTeamLong: vTeamData.team.abbreviation + " " + vTeamData.team.shortDisplayName,                    
        hScore: hTeamData.score,
        vScore: vTeamData.score,
        status: status,
        usePngLogos: true
      });

    });

    return formattedGamesList;

  },



};
