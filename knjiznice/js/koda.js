
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";

var map;
var service;
var infowindow;
var imgHospital = 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Map_marker_icon_%E2%80%93_Nicolas_Mollet_%E2%80%93_First_aid_%E2%80%93_Health_%26_Education_%E2%80%93_Default.png'
var imgUser = 'https://maps.google.com/mapfiles/ms/icons/ltblue-dot.png';


/**
 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
 * enolične ID številke za dostop do funkcionalnosti
 * @return enolični identifikator seje za dostop do funkcionalnosti
 */
function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}

/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */
function generirajPodatke(stPacienta) {
  ehrId = "";
  switch(stPacienta) {
  	case 1:
  		GPkreirajEHRzaBolnika("Francka", "Starejša", "1944-03-02", GPgenerirajPodatkeZaBolnika1);
  		break;
  	case 2:
  		GPkreirajEHRzaBolnika("Tinček", "Polomljeni", "2001-05-27", GPgenerirajPodatkeZaBolnika2);
  		break;
  	case 3:
  		GPkreirajEHRzaBolnika("Marko", "Vitalni", "1985-07-14", GPgenerirajPodatkeZaBolnika3);
  		break;
  }
  return ehrId;
}

function GPkreirajEHRzaBolnika(ime, priimek, datumRojstva, callback) {
	sessionId = getSessionId();

	$.ajaxSetup({
	    headers: {"Ehr-Session": sessionId}
	});
	$.ajax({
	    url: baseUrl + "/ehr",
	    type: 'POST',
	    success: function (data) {
	        var	ehrId = data.ehrId;
	        var partyData = {
	            firstNames: ime,
	            lastNames: priimek,
	            dateOfBirth: datumRojstva,
	            partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
	        };
	        $.ajax({
	            url: baseUrl + "/demographics/party",
	            type: 'POST',
	            contentType: 'application/json',
	            data: JSON.stringify(partyData),
	            async: false,
	            success: function (party) {
	                if (party.action == 'CREATE') {
                      // dodamo novi EHR v drop down meni
                      dodajPacientaIzbira(ehrId, ime, priimek);
                      console.log("vnos novega EHRid: OK");
										if(typeof callback === "function"){
											callback(ehrId);
										}
	                }
	            },
	            error: function(err) {
                  console.log("vnos novega EHRid: NAPAKA");
	            }
	        });
	    }
	});
}

// 5x dodamo podatke o vitalnih znakov bolnika
function GPgenerirajPodatkeZaBolnika1(ehrId){
	GPdodajMeritveVitalnihZnakov(ehrId,"2016-02-03", 166, 45, 36.4, 80, 44, 97, "Franc");
	GPdodajMeritveVitalnihZnakov(ehrId,"2016-02-04", 166, 45, 36.6, 82, 49, 98, "Franc");
	GPdodajMeritveVitalnihZnakov(ehrId,"2016-02-05", 166, 46, 36.5, 79, 48, 97, "Franc");
	GPdodajMeritveVitalnihZnakov(ehrId,"2016-02-06", 166, 45, 36.8, 83, 50, 96, "Franc");
	GPdodajMeritveVitalnihZnakov(ehrId,"2016-02-07", 166, 44, 36.9, 85, 51, 97, "Franc");
}

function GPgenerirajPodatkeZaBolnika2(ehrId){
	GPdodajMeritveVitalnihZnakov(ehrId,"2015-02-03", 173, 55, 36.5, 120, 65, 97, "Štefka");
	GPdodajMeritveVitalnihZnakov(ehrId,"2015-05-11", 173, 54, 37.5, 121, 67, 98, "Štefka");
	GPdodajMeritveVitalnihZnakov(ehrId,"2015-07-05", 173, 57, 36.8, 122, 66, 96, "Štefka");
	GPdodajMeritveVitalnihZnakov(ehrId,"2016-01-07", 173, 65, 36.9, 123, 70, 98, "Štefka");
	GPdodajMeritveVitalnihZnakov(ehrId,"2016-02-14", 173, 62, 37.5, 124, 66, 97, "Štefka");
}

function GPgenerirajPodatkeZaBolnika3(ehrId){
	GPdodajMeritveVitalnihZnakov(ehrId,"2016-02-03", 183, 65, 37.5, 123, 67, 97, "Lojze");
	GPdodajMeritveVitalnihZnakov(ehrId,"2016-02-04", 183, 66, 37.5, 124, 69, 98, "Lojze");
	GPdodajMeritveVitalnihZnakov(ehrId,"2016-02-05", 183, 64, 37.5, 125, 70, 97, "Lojze");
	GPdodajMeritveVitalnihZnakov(ehrId,"2016-02-06", 183, 65, 37.5, 121, 65, 98, "Lojze");
	GPdodajMeritveVitalnihZnakov(ehrId,"2016-02-07", 183, 64, 37.5, 120, 68, 96, "Lojze");
}

// spremenjena funkcija za dodajanje meritev v primeru generiranja podatkov
function GPdodajMeritveVitalnihZnakov(ehrId, datumInUra, telesnaVisina, telesnaTeza, telesnaTemperatura, sistolicniKrvniTlak, diastolicniKrvniTlak, nasicenostKrviSKisikom, merilec) {
	sessionId = getSessionId();

	$.ajaxSetup({
	    headers: {"Ehr-Session": sessionId}
	});
	var podatki = {
		// Struktura predloge je na voljo na naslednjem spletnem naslovu:
    // https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
	    "ctx/language": "en",
	    "ctx/territory": "SI",
	    "ctx/time": datumInUra,
	    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
	    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
	   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
	    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
	    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
	    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
	    "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
	};
	var parametriZahteve = {
	    ehrId: ehrId,
	    templateId: 'Vital Signs',
	    format: 'FLAT',
	    committer: merilec
	};
	$.ajax({
	    url: baseUrl + "/composition?" + $.param(parametriZahteve),
	    type: 'POST',
	    contentType: 'application/json',
	    data: JSON.stringify(podatki),
	    success: function (res) {
          console.log("vnose meritve OK");
	    },
	    error: function(err) {
          console.log("vnos meritve NAPAKA");
	    }
	});
}

function kreirajEHRzaBolnika() {
	sessionId = getSessionId();

	var ime = $("#kreirajIme").val();
	var priimek = $("#kreirajPriimek").val();
	var datumRojstva = $("#kreirajDatumRojstva").val();

	if (!ime || !priimek || !datumRojstva || ime.trim().length == 0 ||
      priimek.trim().length == 0 || datumRojstva.trim().length == 0) {
		$("#kreirajSporocilo").html("<span class='obvestilo label " +
      "label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		$.ajax({
		    url: baseUrl + "/ehr",
		    type: 'POST',
		    success: function (data) {
		        var ehrId = data.ehrId;
		        var partyData = {
		            firstNames: ime,
		            lastNames: priimek,
		            dateOfBirth: datumRojstva,
		            partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
		        };
		        $.ajax({
		            url: baseUrl + "/demographics/party",
		            type: 'POST',
		            contentType: 'application/json',
		            data: JSON.stringify(partyData),
		            success: function (party) {
		                if (party.action == 'CREATE') {
		                    $("#kreirajSporocilo").html("<span class='obvestilo " +
                          "label label-success fade-in'>Uspešno kreiran EHR '" +
                          ehrId + "'.</span>");
		                    $("#preberiEHRid").val(ehrId);
		                    dodajPacientaIzbira(ehrId, ime, priimek);
		                    $("#kreirajIme").val("");
												$("#kreirajPriimek").val("");
												$("#kreirajDatumRojstva").val("");
		                }
		            },
		            error: function(err) {
		            	$("#kreirajSporocilo").html("<span class='obvestilo label " +
                    "label-danger fade-in'>Napaka '" +
                    JSON.parse(err.responseText).userMessage + "'!");
		            }
		        });
		    }
		});
	}
}

function dodajPacientaIzbira(ehrId, ime, priimek){
	$("#preberiObstojeciEHR").append("<option value='" + ehrId + "'>" + ime + " " + priimek + "</option>");
}


/**
 * Za podan EHR ID preberi demografske podrobnosti pacienta in izpiši sporočilo
 * s pridobljenimi podatki (ime, priimek in datum rojstva).
 */
function preberiEHRodBolnika() {
	sessionId = getSessionId();
	
	var ehrId = $("#preberiEHRid").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#preberiSporocilo").html("<span class='obvestilo label label-warning " +
      "fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#preberiSporocilo").html("<span class='obvestilo label " +
          "label-success fade-in'>Bolnik '" + party.firstNames + " " +
          party.lastNames + "', ki se je rodil '" + party.dateOfBirth +
          "'.</span>");
        // istocasno pridobimo tudi vse ostale podatke o meritvah pacienta
        preberiMeritveVitalnihZnakov($("#preberiEHRid").val(), "telesna višina");
        // nastavimo vrednosti za vnos meritev
        $("#vnosMeritveEHRid").text(ehrId);
        $("#vnosMeritveImeEHRid").text(party.firstNames);
        $("#vnosMeritvePriimekEHRid").text(party.lastNames);
        $("#vnosMeritveDatumRojstvaEHRid").text(party.dateOfBirth);
        
        // gumbi razširi niso delujoči, skrijemo tudi podrobnosti prikaza in vnosa meritev
        $("#buttonRazsiriPrikazMeritev").removeAttr('disabled');
		$("#buttonRazsiriVnosMeritev").removeAttr('disabled');
			},
			error: function(err) {
				$("#preberiSporocilo").html("<span class='obvestilo label " +
          "label-danger fade-in'>Napaka '" +
          JSON.parse(err.responseText).userMessage + "'!");
              // gumbi razširi niso delujoči, skrijemo tudi podrobnosti prikaza in vnosa meritev
			  $("#buttonRazsiriPrikazMeritev").attr('disabled', 'disabled');
			  $("#buttonRazsiriVnosMeritev").attr('disabled', 'disabled');
			  $('#bodyVnosMeritev').hide();
			  $('#bodyPrikazMeritev').hide();
			  $("#buttonRazsiriPrikazMeritev").text("Razširi");
			  $("#buttonRazsiriVnosMeritev").text("Razširi");
			  
			}
		});
	}
}


/**
 * Za dodajanje vitalnih znakov pacienta je pripravljena kompozicija, ki
 * vključuje množico meritev vitalnih znakov (EHR ID, datum in ura,
 * telesna višina, telesna teža, sistolični in diastolični krvni tlak,
 * nasičenost krvi s kisikom in merilec).
 */
function dodajMeritveVitalnihZnakov() {
	sessionId = getSessionId();

	var ehrId = $("#preberiEHRid").val();
	var datumInUra = $("#dodajVitalnoDatumInUra").val();
	var telesnaVisina = $("#dodajVitalnoTelesnaVisina").val();
	var telesnaTeza = $("#dodajVitalnoTelesnaTeza").val();
	var telesnaTemperatura = $("#dodajVitalnoTelesnaTemperatura").val();
	var sistolicniKrvniTlak = $("#dodajVitalnoKrvniTlakSistolicni").val();
	var diastolicniKrvniTlak = $("#dodajVitalnoKrvniTlakDiastolicni").val();
	var nasicenostKrviSKisikom = $("#dodajVitalnoNasicenostKrviSKisikom").val();
	var merilec = $("#dodajVitalnoMerilec").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo " +
      "label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		var podatki = {
			// Struktura predloge je na voljo na naslednjem spletnem naslovu:
      // https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
		    "ctx/language": "en",
		    "ctx/territory": "SI",
		    "ctx/time": datumInUra,
		    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
		    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
		   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
		    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
		    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
		    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
		    "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
		};
		var parametriZahteve = {
		    ehrId: ehrId,
		    templateId: 'Vital Signs',
		    format: 'FLAT',
		    committer: merilec
		};
		$.ajax({
		    url: baseUrl + "/composition?" + $.param(parametriZahteve),
		    type: 'POST',
		    contentType: 'application/json',
		    data: JSON.stringify(podatki),
		    success: function (res) {
		        $("#dodajMeritveVitalnihZnakovSporocilo").html(
              "<span class='obvestilo label label-success fade-in'>Nove meritve vitalnih znakov uspešno dodane</span>");
            	preberiEHRodBolnika();
            	$("#dodajVitalnoDatumInUra").val("");
				$("#dodajVitalnoTelesnaVisina").val("");
				$("#dodajVitalnoTelesnaTeza").val("");
				$("#dodajVitalnoTelesnaTemperatura").val("");
				$("#dodajVitalnoKrvniTlakSistolicni").val("");
				$("#dodajVitalnoKrvniTlakDiastolicni").val("");
				$("#dodajVitalnoNasicenostKrviSKisikom").val("");
				$("#dodajVitalnoMerilec").val("");
		    },
		    error: function(err) {
		    	$("#dodajMeritveVitalnihZnakovSporocilo").html(
            "<span class='obvestilo label label-danger fade-in'>Napaka pri dodajanju meritev!</span>");
		    }
		});
	}
}

/**
 * Pridobivanje vseh zgodovinskih podatkov meritev izbranih vitalnih znakov
 * (telesna temperatura, filtriranje telesne temperature in telesna teža).
 * Filtriranje telesne temperature je izvedena z AQL poizvedbo, ki se uporablja
 * za napredno iskanje po zdravstvenih podatkih.
 */
function preberiMeritveVitalnihZnakov(ehrId, tip) {
	sessionId = getSessionId();

	var graphData = new Array();
	var graphParVrednosti = new Array();
	var graphTitle;
	var graphAxisX;
	var graphAxisY;
	var enota;
	
	Highcharts.setOptions({
		global: {
		    useUTC: false
		}
	});

	if (!ehrId || ehrId.trim().length == 0 || !tip || tip.trim().length == 0) {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo " +
      "label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
	    	type: 'GET',
	    	headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
	    		var tipMeritve = "<div><select class='form-control input-sm' id='preberiTipZaVitalneZnake' onchange='posodobiPrikazMeritev()'>"+
	    											"<option value='telesna višina'>telesna višina</option>"+
	    											"<option value='telesna teža'>telesna teža</option>"+
	    											"<option value='telesna temperatura'>telesna temperatura</option>"+
	    											"<option value='sistolični krvni tlak'>sistolicni krvni tlak</option>"+
	    											"<option value='diastolični krvni tlak'>diastolicni krvni tlak</option>"+
	    											"<option value='nasičenost krvi s kisikom'>nasičenost krvi s kisikom</option></select></div><br>"
				var party = data.party;
				$("#rezultatMeritveVitalnihZnakov").html("<br/><span>Pridobivanje " +
          "podatkov za <b>'" + tip + "'</b> bolnika <b>'" + party.firstNames +
          " " + party.lastNames + "'</b>.</span><br/><br/>");
          		$("#rezultatMeritveVitalnihZnakov").append(tipMeritve);
				if (tip == "telesna temperatura") {
					$.ajax({
  					    url: baseUrl + "/view/" + ehrId + "/" + "body_temperature",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						    	var results = "<table class='table table-striped " +
                    "table-hover'><tr><th>Datum in ura</th>" +
                    "<th class='text-right'>Telesna temperatura</th></tr>";
						        for (var i in res) {
						            results += "<tr><td>" + res[i].time +
                          "</td><td class='text-right'>" + res[i].temperature +
                          " " + res[i].unit + "</td>";
                        enota = res[i].unit;
                        graphParVrednosti = [Date.parse(res[i].time), res[i].temperature];  
                        graphData.unshift(graphParVrednosti);
                        
                        console.log(graphParVrednosti);
						        }
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
						    /* 
						    izpis grafa    
						    */  
						    		console.log(graphData);
						    		
						    		$('#grafPrikazMeritev').highcharts({
								      chart: {
								          type: 'line'
								      },
								      title: {
								          text: tip
								      },
								      xAxis: {
								          type: 'datetime',
								          title: { 
								          	text: "datum in čas"
								          },
								      },
								      yAxis: {
								          title: {
								              text: tip
								          },
								          labels: {
            						    formatter: function () {
                  					return this.value +' ' +enota;
						                }
						          	  }
									    },
									    tooltip: {
									    		headerFormat: "",
							            pointFormat: '{point.x:%Y-%m-%d %H-%M-%S} : {point.y:.2f}' + enota
							        },
								      plotOptions: {
							            line: {
							                marker: {
                    						enabled: true
							                }
							            }
							        },
								      series: [{
								          name: 'Bolnik',
								          data: graphData
								      }]
								  });
						    		
						    
					    	} else {
					    		$("#rezultatMeritveVitalnihZnakov").html("<span style='align: center'>Za bolnika še ni vnešenih meritev vitalnih znakov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
				} else if (tip == "telesna teža") {
					$.ajax({
					    url: baseUrl + "/view/" + ehrId + "/" + "weight",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						    	var results = "<table class='table table-striped " +
                    "table-hover'><tr><th>Datum in ura</th>" +
                    "<th class='text-right'>Telesna teža</th></tr>";
						        for (var i in res) {
						            results += "<tr><td>" + res[i].time +
                          "</td><td class='text-right'>" + res[i].weight + " " 	+
                          res[i].unit + "</td>";
                        enota = res[i].unit;
                        graphParVrednosti = [Date.parse(res[i].time), res[i].weight];  
                        graphData.unshift(graphParVrednosti);
						        }
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
						        
				        		$('#grafPrikazMeritev').highcharts({
								      chart: {
								          type: 'line'
								      },
								      title: {
								          text: tip
								      },
								      xAxis: {
								          type: 'datetime',
								          title: { 
								          	text: "datum in čas"
								          },
								      },
								      yAxis: {
								          title: {
								              text: tip
								          },
								          labels: {
		        						    formatter: function () {
		              					return this.value +' ' +enota;
						                }
						          	  }
									    },
									    tooltip: {
									    		headerFormat: "",
							            pointFormat: '{point.x:%Y-%m-%d %H-%M-%S} : {point.y:.2f}' + enota
							        },
								      plotOptions: {
							            line: {
							                marker: {
		                						enabled: true
							                }
							            }
							        },
								      series: [{
								          name: 'Bolnik',
								          data: graphData
								      }]
								  });
					    	} else {
					    		$("#rezultatMeritveVitalnihZnakov").html("<span style='align: center'>Za bolnika še ni vnešenih meritev vitalnih znakov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
				} else if (tip == "telesna višina") {
					$.ajax({
					    url: baseUrl + "/view/" + ehrId + "/" + "height",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						    	var results = "<table class='table table-striped " +
                    "table-hover'><tr><th>Datum in ura</th>" +
                    "<th class='text-right'>Telesna višina</th></tr>";
						        for (var i in res) {
						            results += "<tr><td>" + res[i].time +
                          "</td><td class='text-right'>" + res[i].height + " " 	+
                          res[i].unit + "</td>";
                        enota = res[i].unit;
                        graphParVrednosti = [Date.parse(res[i].time), res[i].height];  
                        graphData.unshift(graphParVrednosti);
						        }
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
						        
						        		$('#grafPrikazMeritev').highcharts({
								      chart: {
								          type: 'line'
								      },
								      title: {
								          text: tip
								      },
								      xAxis: {
								          type: 'datetime',
								          title: { 
								          	text: "datum in čas"
								          },
								      },
								      yAxis: {
								          title: {
								              text: tip
								          },
								          labels: {
		        						    formatter: function () {
		              					return this.value +' ' +enota;
						                }
						          	  }
									    },
									    tooltip: {
									    		headerFormat: "",
							            pointFormat: '{point.x:%Y-%m-%d %H-%M-%S} : {point.y:.2f}' + enota
							        },
								      plotOptions: {
							            line: {
							                marker: {
		                						enabled: true
							                }
							            }
							        },
								      series: [{
								          name: 'Bolnik',
								          data: graphData
								      }]
								  });
					    	} else {
					    		$("#rezultatMeritveVitalnihZnakov").html("<span style='align: center'>Za bolnika še ni vnešenih meritev vitalnih znakov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});	
				} else if (tip == "sistolični krvni tlak") {
					$.ajax({
					    url: baseUrl + "/view/" + ehrId + "/blood_pressure",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						    	var results = "<table class='table table-striped " +
                    "table-hover'><tr><th>Datum in ura</th>" +
                    "<th class='text-right'>Sistolični krvni tlak</th></tr>";
						        for (var i in res) {
						            results += "<tr><td>" + res[i].time +
                          "</td><td class='text-right'>" + res[i].systolic + " " 	+
                          res[i].unit + "</td>";
                        enota = res[i].unit;
                        graphParVrednosti = [Date.parse(res[i].time), res[i].systolic];  
                        graphData.unshift(graphParVrednosti);
						        }
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
						        
						        		$('#grafPrikazMeritev').highcharts({
								      chart: {
								          type: 'line'
								      },
								      title: {
								          text: tip
								      },
								      xAxis: {
								          type: 'datetime',
								          title: { 
								          	text: "datum in čas"
								          },
								      },
								      yAxis: {
								          title: {
								              text: tip
								          },
								          labels: {
		        						    formatter: function () {
		              					return this.value +' ' +enota;
						                }
						          	  }
									    },
									    tooltip: {
									    		headerFormat: "",
							            pointFormat: '{point.x:%Y-%m-%d %H-%M-%S} : {point.y:.2f}' + enota
							        },
								      plotOptions: {
							            line: {
							                marker: {
		                						enabled: true
							                }
							            }
							        },
								      series: [{
								          name: 'Bolnik',
								          data: graphData
								      }]
								  });
					    	} else {
					    		$("#rezultatMeritveVitalnihZnakov").html("<span style='align: center'>Za bolnika še ni vnešenih meritev vitalnih znakov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});	
				} else if (tip == "diastolični krvni tlak") {
					$.ajax({
					    url: baseUrl + "/view/" + ehrId + "/blood_pressure",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						    	var results = "<table class='table table-striped " +
                    "table-hover'><tr><th>Datum in ura</th>" +
                    "<th class='text-right'>Diastolični krvni tlak</th></tr>";
						        for (var i in res) {
						            results += "<tr><td>" + res[i].time +
                          "</td><td class='text-right'>" + res[i].diastolic + " " 	+
                          res[i].unit + "</td>";
                        enota = res[i].unit;
                        graphParVrednosti = [Date.parse(res[i].time), res[i].diastolic];  
                        graphData.unshift(graphParVrednosti);
						        }
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
						        
						        		$('#grafPrikazMeritev').highcharts({
								      chart: {
								          type: 'line'
								      },
								      title: {
								          text: tip
								      },
								      xAxis: {
								          type: 'datetime',
								          title: { 
								          	text: "datum in čas"
								          },
								      },
								      yAxis: {
								          title: {
								              text: tip
								          },
								          labels: {
		        						    formatter: function () {
		              					return this.value +' ' +enota;
						                }
						          	  }
									    },
									    tooltip: {
									    		headerFormat: "",
							            pointFormat: '{point.x:%Y-%m-%d %H-%M-%S} : {point.y:.2f}' + enota
							        },
								      plotOptions: {
							            line: {
							                marker: {
		                						enabled: true
							                }
							            }
							        },
								      series: [{
								          name: 'Bolnik',
								          data: graphData
								      }]
								  });
					    	} else {
					    		$("#rezultatMeritveVitalnihZnakov").html("<span style='align: center'>Za bolnika še ni vnešenih meritev vitalnih znakov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
				} else if (tip == "nasičenost krvi s kisikom") {
					$.ajax({
					    url: baseUrl + "/view/" + ehrId + "/spO2",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						    	var results = "<table class='table table-striped " +
                    "table-hover'><tr><th>Datum in ura</th>" +
                    "<th class='text-right'>Nasičenost krvi s kisikom</th></tr>";
						        for (var i in res) {
						            results += "<tr><td>" + res[i].time +
                          "</td><td class='text-right'>" + res[i].spO2 + " " 	+
                          "%" + "</td>";
                        enota = "%";
                        graphParVrednosti = [Date.parse(res[i].time), res[i].spO2];  
                        graphData.unshift(graphParVrednosti);
						        }
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
						        
						        			$('#grafPrikazMeritev').highcharts({
								      chart: {
								          type: 'line'
								      },
								      title: {
								          text: tip
								      },
								      xAxis: {
								          type: 'datetime',
								          title: { 
								          	text: "datum in čas"
								          },
								      },
								      yAxis: {
								          title: {
								              text: tip
								          },
								          labels: {
		        						    formatter: function () {
		              					return this.value +' ' +enota;
						                }
						          	  }
									    },
									    tooltip: {
									    		headerFormat: "",
							            pointFormat: '{point.x:%Y-%m-%d %H-%M-%S} : {point.y:.2f}' + enota
							        },
								      plotOptions: {
							            line: {
							                marker: {
		                						enabled: true
							                }
							            }
							        },
								      series: [{
								          name: 'Bolnik',
								          data: graphData
								      }]
								  });
					    	} else {
					    		$("#rezultatMeritveVitalnihZnakov").html("<span style='align: center'>Za bolnika še ni vnešenih meritev vitalnih znakov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});			
				} 
				
				$("#preberiTipZaVitalneZnake").addEventListener;
				$("#preberiTipZaVitalneZnake").val(tip);
	    	},
	    	error: function(err) {
	    		$("#preberiMeritveVitalnihZnakovSporocilo").html(
            "<span class='obvestilo label label-danger fade-in'>Napaka '" +
            JSON.parse(err.responseText).userMessage + "'!");
	    	}
		});
	}
}

function posodobiPrikazMeritev() {
	sessionId = getSessionId();

	var ehrId = $("#preberiEHRid").val();
	var tip = $("#preberiTipZaVitalneZnake").val();
	console.log(tip);
	preberiMeritveVitalnihZnakov(ehrId, tip);
}

function razsiriKreirajEHR() {
	sessionId = getSessionId();

	var visible = $("#bodyKreirajEHR").is(":visible");
	
	if (visible) {
		$('#bodyKreirajEHR').hide();
		$('#buttonRazsiriKreirajEHR').text("Razširi");
	} else {
		$('#bodyKreirajEHR').show();
		$('#buttonRazsiriKreirajEHR').text("Skrij");
	}
}

function razsiriPrikazMeritev() {
	sessionId = getSessionId();

	var visible = $("#bodyPrikazMeritev").is(":visible");
	var sporocilo = $("#preberiSporocilo").val();
	
	if(sporocilo!="" || sporocilo!="Prosim vnesite zahtevan podatek!") {
		
		if (visible) {
			$('#bodyPrikazMeritev').hide();
			$('#buttonRazsiriPrikazMeritev').text("Razširi");
		} else {
			$('#bodyPrikazMeritev').show();
			$('#buttonRazsiriPrikazMeritev').text("Skrij");
		}
	}
}

function razsiriVnosMeritev() {
	sessionId = getSessionId();

	var visible = $("#bodyVnosMeritev").is(":visible");
	
	if (visible) {
		$('#bodyVnosMeritev').hide();
		$('#buttonRazsiriVnosMeritev').text("Razširi");
	} else {
		$('#bodyVnosMeritev').show();
		$('#buttonRazsiriVnosMeritev').text("Skrij");
	}
}

// Google maps, geolocation, bolnišnice v radiju 100km

function initMap() {
  var pos = {lat: -34.397, lng: 150.644};
  map = new google.maps.Map(document.getElementById('map'), {
    center: pos,
    zoom: 9
  });
  
  infowindow = new google.maps.InfoWindow({map: map});
  service = new google.maps.places.PlacesService(map);
  
  // Try HTML5 geolocation.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
							
  		var userMarker = new google.maps.Marker({
    		position: pos,
    		map: map,
    		icon: imgUser,
    		title: "Vaša lokacija"
  		});

      infowindow.setPosition(pos);
      infowindow.setContent('Nahajate se tu.');
      map.setCenter(pos);
      
      service.nearbySearch({
    		location: pos,
    		radius: 100000,					// radij 100km
    		type: ['hospital']
  		}, callback);
      
      
    }, function() {
      handleLocationError(true, infowindow, map.getCenter());
    });
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infowindow, map.getCenter());
  }
}

function callback(results, status) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      createMarkerPlaceId(results[i]);			// spremenjena funkcija za izpis podrobnosti
      //console.log(results[i]["place_id"]);  // testni izpis
    }
  }
}

function createMarkerPlaceId(place) {
	  service.getDetails({
    placeId: place["place_id"]
  }, function(place, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        icon: imgHospital
      });
      google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent('<div><strong>' + place.name + '</strong><br>' +
          place.formatted_address + '<br>Tel.: ' + place.international_phone_number + '</div>');
        infowindow.open(map, this);
      });
    }
  });
}


function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(browserHasGeolocation ?
                        'Error: The Geolocation service failed.' :
                        'Error: Your browser doesn\'t support geolocation.');
}

$(document).ready(function() {
  /**
   * Napolni testni EHR ID pri prebiranju EHR zapisa obstoječega bolnika,
   * ko uporabnik izbere vrednost iz padajočega menuja
   * (npr. Dejan Lavbič, Pujsa Pepa, Ata Smrk)
   */
	$('#preberiObstojeciEHR').change(function() {
		$("#preberiSporocilo").html("");
		$("#preberiEHRid").val($(this).val());
		preberiEHRodBolnika()
	});
	
	// prikaz bolnikovega EHR s pritiskom na tipko enter, ko vnesemo ehrId
	$('#preberiEHRid').keypress(function(e) {
    if(e.which === 13) {
        preberiEHRodBolnika();
    }
	});
});