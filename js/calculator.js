//load default keyboard and nad settings 
var data = {}
$(document).ready(function() {
    $("#keyboard-placeholder").load("db/eng.html");
  	segments = (function () {
    segments = null;
    $.ajax({
        'async': false,
        'global': false,
        'url': 'db/eng.json',
        'dataType': "json",
        'success': function (data) {
            segments = data;
        }
    });
    return segments;
})(); 
});

//load  keyboard and nad settings when language changed
$('#db').change(function() {
	var lang = $('#db').val();
	$("#keyboard-placeholder").load("db/"+lang+".html");
  	segments = (function () {
    segments = null;
    $.ajax({
        'async': false,
        'global': false,
        'url': 'db/'+lang+'.json',
        'dataType': "json",
        'success': function (data) {
            segments = data;
        }
    });
    return segments;
})(); 
});

//replace non-ligatures with temporary symbols
function tempSymbols(cluster) {
	var mapObj = {
  	t͡ʂ:"T",
 	d͡ʐ:"D",
   	j̃:"J",
   	w̃:"W",
   	t̪:"T",
   	d̪:"D",
   	ʦ̪: "C", 
   	ʣ̪: "Q"
	};
	cluster = cluster.replace(/t͡ʂ|d͡ʐ|j̃|w̃|t̪|d̪/gi, function(matched){
  	return mapObj[matched];
	});
	return cluster;
}

//identify cluster type and return error if cluster is invalid
function identifyCluster(cluster) {
	var noOfConsonants = 0;
	var initialVowel = 0;
	var finalVowel = 0;
	cluster = tempSymbols(cluster);
	//checks whether character is a vowel
	function isVowel(segment) {
		if (segments.segments[segment].isVowel) {
			return true;
		}
		else {
			return false;
		}
	}
	for (var i = 0, len = cluster.length; i < len; i++) {	
		if (!segments.segments[cluster[i]]) {
			return "contains illegal characters";
		}
  		else if (isVowel(cluster[i])) {
  			if (i === 0) {
  				initialVowel = initialVowel + 1;
  			}
  			else if (i = cluster.length) {
  				finalVowel = finalVowel + 1;
  			}
  			else {
  				return "not a cluster";
  			}
  		}
  		else {
  			noOfConsonants = noOfConsonants + 1;
  		}
	}
	if (cluster.length === 0) {
			return "no cluster specified";
		}
	if (initialVowel === 1 && finalVowel === 1) {
		if (noOfConsonants < 2) {
			return "not a cluster";
		}
		if (noOfConsonants === 2) {
			return "VCCV";
		}
		if (noOfConsonants === 3) {
			return "VCCCV";
		}
		else {
			return "cluster too big";		
		}
	}
	else if (initialVowel === 1 && finalVowel === 0) {
		if (noOfConsonants < 2) {
			return "not a cluster";
		}
		if (noOfConsonants === 2) {
			return "VCC";
		}
		if (noOfConsonants === 3) {
			return "VCCC";
		}
		else {
			return "cluster too big";		
		}
	}
	else if (initialVowel === 0 && finalVowel === 1) {
		if (noOfConsonants < 2) {
			return "not a cluster";
		}
		if (noOfConsonants === 2) {
			return "CCV";
		}
		if (noOfConsonants === 3) {
			return "CCCV";
		}
		else {
			return "cluster too big";		
		}
	}
	else {
		return "position of vowel(s) not specified";
	}
}

//calculate NAD value based on cluster type
function calculateNAD(cluster) {
	cluster = tempSymbols(cluster);
	var clusterType = identifyCluster(cluster);
	//formula for calculating NAD between two consonants
	function calcnadCC(C1,C2) {
		if ($('#include-sonority').is(':checked')) {
			if (C1.son !== C2.son) {
				return eval(Math.abs(C1.moa - C2.moa) + Math.abs(C1.poa - C2.poa) + 1);		
			}
			else {
				return eval(Math.abs(C1.moa - C2.moa) + Math.abs(C1.poa - C2.poa));
			}
		}
		else {
			return eval(Math.abs(C1.moa - C2.moa) + Math.abs(C1.poa - C2.poa));
		}	
	}
	//formula for calculating NAD between a consonant and vowel
	function calcnadCV(C,V) {
		if ($('#include-sonority').is(':checked')) {
			if (C.son !== V.son) {
				return eval(Math.abs(C.moa - V.moa) + 1);		
			}
			else {
				return Math.abs(C.moa - V.moa);
			}
		}
		else {
			return Math.abs(C.moa - V.moa);
		}
	}
	var result = "";
	var nadC1C2 = 0;
	var nadC2C3 = 0;
	var nadCV = 0;
	var nadVC = 0;
	var preference = "-";
	switch(clusterType) 
	{
	case "CCV":
		nadC1C2 = calcnadCC(segments.segments[cluster[0]],segments.segments[cluster[1]]);
		nadCV = calcnadCV(segments.segments[cluster[1]],segments.segments[cluster[2]]);
		if (nadC1C2 >= nadCV) {
			preference = "Yes";
		}
		else {
			preference = "No";
		}
		result = "<td>-</td><td>"+nadC1C2.toFixed(1)+"</td><td>-</td><td>"+nadCV.toFixed(1)+"</td><td class='nad'>"+preference+"</td>"
		return result;
	break;
	case "VCC":
		nadC1C2 = calcnadCC(segments.segments[cluster[1]],segments.segments[cluster[2]]);
		nadVC = calcnadCV(segments.segments[cluster[0]],segments.segments[cluster[1]]);
		if (nadC1C2 >= nadVC) {
			preference = "Yes";
		}
		else {
			preference = "No";
		}
		return "<td>"+nadVC.toFixed(1)+"</td><td>"+nadC1C2.toFixed(1)+"</td><td>-</td><td>-</td><td class='nad'>"+preference+"</td>";
	break;
	case "VCCV":
		nadVC = calcnadCV(segments.segments[cluster[0]],segments.segments[cluster[1]]);
		nadCV = calcnadCV(segments.segments[cluster[2]],segments.segments[cluster[3]]);
		nadC1C2 = calcnadCC(segments.segments[cluster[1]],segments.segments[cluster[2]]);
		if (nadVC >= nadC1C2 && nadC1C2 < nadCV && nadC1C2 > 0) {
			preference = "Yes";
		}
		else {
			preference = "No";
		}
		return "<td>"+nadVC.toFixed(1)+"</td><td>"+nadC1C2.toFixed(1)+"</td><td>-</td><td>"+nadCV.toFixed(1)+"</td><td class='nad'>"+preference+"</td>";
	break;
	case "CCCV":
		nadC1C2 = calcnadCC(segments.segments[cluster[0]],segments.segments[cluster[1]]);
		nadC2C3 = calcnadCC(segments.segments[cluster[1]],segments.segments[cluster[2]]);
		nadCV = calcnadCV(segments.segments[cluster[2]],segments.segments[cluster[3]]);
		if (nadC1C2 < nadC2C3 && nadC2C3 >= nadCV) {
			preference = "Yes";
		}
		else {
			preference = "No";
		}
		result = "<td>-</td><td>"+nadC1C2.toFixed(1)+"</td><td>"+nadC2C3.toFixed(1)+"</td><td>"+nadCV.toFixed(1)+"</td><td class='nad'>"+preference+"</td>"
		return result;
	break;
	case "VCCC":
		nadC1C2 = calcnadCC(segments.segments[cluster[1]],segments.segments[cluster[2]]);
		nadC2C3 = calcnadCC(segments.segments[cluster[2]],segments.segments[cluster[3]]);
		nadVC = calcnadCV(segments.segments[cluster[0]],segments.segments[cluster[1]]);
		if (nadVC <= nadC1C2 && nadC1C2 > nadC2C3) {
			preference = "Yes";
		}
		else {
			preference = "No";
		}
		result = "<td>"+nadVC.toFixed(1)+"</td><td>"+nadC1C2.toFixed(1)+"</td><td>"+nadC2C3.toFixed(1)+"</td><td>-</td><td class='nad'>"+preference+"</td>"
		return result;
	break;
	break;
	case "VCCCV":
		nadC1C2 = calcnadCC(segments.segments[cluster[1]],segments.segments[cluster[2]]);
		nadC2C3 = calcnadCC(segments.segments[cluster[2]],segments.segments[cluster[3]]);
		nadVC = calcnadCV(segments.segments[cluster[0]],segments.segments[cluster[1]]);
		nadCV = calcnadCV(segments.segments[cluster[3]],segments.segments[cluster[4]]);
		if (nadVC >= nadC1C2 && nadC2C3 < nadCV) {
			preference = "Yes";
		}
		else {
			preference = "No";
		}
		result = "<td>"+nadVC.toFixed(1)+"</td><td>"+nadC1C2.toFixed(1)+"</td><td>"+nadC2C3.toFixed(1)+"</td><td>"+nadCV.toFixed(1)+"</td><td class='nad'>"+preference+"</td>"
		return result;
	break;
	default:
		return "-";
 	}
}

//iterate through each line in text area when Calculate clicked
$('#target').click(function() {	
	//clear table
	$('#result table tbody').html('');
	var cluster = $('#clusters').val().split('\n');
	$.each(cluster, function(){
		$('#result table tbody').append('<tr><td>'+this+'</td><td>'+identifyCluster(this)+'</td>'+calculateNAD(this)+'<tr>');
	});
	//colour table rows based on nad value
	$("#result table .nad").each( function() {
		var thisCell = $(this);
		var cellValue = thisCell.text();
		if (cellValue === "Yes") {
			thisCell.parent().addClass("success");
		}
		else if (cellValue === "No") {
			thisCell.parent().addClass("error");
		}
		else {
			return false;
		}
  	});
});

//clear textarea when Clear is pressed
$('#remove').click(function() {
	$('#clusters').val('');
});

//clear table when Clear table is pressed
$('#clear-table').click(function() {
	$('#result table tbody').html('');
});

//prevent user from inputing non-digit characters in NAD values
$('body').on('keypress','input[type=number]',function(event) {
    //Only allow period and numbers
    if ((event.which != 46 || $(this).val().indexOf('.') != -1) && (event.which < 48 || event.which > 57)) {
        event.preventDefault();
    }
    //Prevent a period being entered first
    else if (event.which == 46 && $(this).val().length == 0) {
        event.preventDefault();
    }
    //Only one number after a decimal
    else if (($(this).val().indexOf('.') != -1) && ($(this).val().substring($(this).val().indexOf('.'), $(this).val().indexOf('.').length).length > 1)) {
        event.preventDefault();
    }
});

//modify NAD values
function modifyNAD() {
	//get id of current element
	var idNAD = $(this).attr('id');
	//get NAD value of clicked element
	var newNAD = $(this).val();
	//if clicked on horizontal values
	if ($(this).attr("class") == "moa") {
		//specify the position of the column clicked
   		var thisIndex = $(this).parent().parent().children().index($(this).parent());
    	//iterate through each row
    	$(this).parent().parent().parent().children('tr').each(function () {
    		//iterate through each button in row
    		$(this).find('button:not(.empty)').each(function (index, element) {
    			//if a button if in the same column as the column clicked, print value of button
				if ($(this).parent().parent().children().index($(this).parent()) === thisIndex) {
					//update moa NAD value of matched token
					var token = $(this).html();
					var token = tempSymbols(token);
					segments.segments[token].moa = newNAD;
				}
			});
		});
	}
	//else if clicked on vertical values
    else if ($(this).attr("class") == "poa") {
		//specify the position of the column clicked
  		var thisIndex = $(this).parent().parent().parent().children().index($(this).parent().parent());
    	//iterate through each row
    	$(this).parent().parent().parent().children('tr').each(function () {
    		//iterate through each button in row
    		$(this).find('button:not(.empty,.labiovelar)').each(function (index, element) {
    			//if a button if in the same column as the column clicked, print value of button
				if ($(this).parent().parent().parent().children().index($(this).parent().parent()) === thisIndex) {
					//update poa NAD value of matched token
					var token = $(this).html();
					var token = tempSymbols(token);
					if (idNAD === "bilabialNAD" || idNAD === "velarNAD") {
						segments.segments[token].poa = newNAD;
						var newLabialVelarNAD = parseFloat($('#bilabialNAD').val(), 10) + parseFloat($('#velarNAD').val(), 10);
						segments.segments["w"].poa = newLabialVelarNAD/2;
						segments.segments["ʍ"].poa = newLabialVelarNAD/2;
						if ($('#db').val() === "pl") {
							segments.segments["W"].poa = newLabialVelarNAD/2;
						}						
					}
					else {
					segments.segments[token].poa = newNAD;
					}
				}
			});
		});
  	}
}
$('body').on('blur', 'input[type=number]', function() {
	$.proxy(modifyNAD, $('input[type=number]'))();
});

var customNAD = 0;
$('textarea').focus(function() {
	if (customNAD == 0) {
		$.proxy(modifyNAD, $('input[type=number]'))();
		customNAD++;
	}
	else {
		return false;
	}
});