function get_testrun_overview(testruns){
	var testrun = testruns.pop();
	$.ajax({
		url:'php/testrun.php',
		type:'POST',
		dataType:'json',
		data:{
			"action":"get_testrun_overview",			
			"trid":testrun.id
		},
		success:function(response) {
			if(response.result=="Pass"){
				var tbody = $("#table_tr_overview>tbody");
				//***************** get_tr_documents ************************
				for (index in response.documents){
					var doc = response.documents[index];
					var tr_html = '<tr>';
					tr_html+='<td col_grp="TestRun" value="'+testrun.id+'">'+testrun.name+'</td>';
					tr_html+='<td col_grp="Title">'+doc.name+'</td>';
					tr_html+='<td col_grp="All"><font>'+doc.amount+'</font></td>';
					tr_html+='<td col_grp="P,F,B,E,I"><font>'+parseInt(doc.amount-doc.non_count)+'</font></td>';
					tr_html+='<td col_grp="N"><font>'+doc.non_count+'</font></td>';
					tr_html+='<td col_grp="P"><font>'+doc.p_count+'</font></td>';
					tr_html+='<td col_grp="F"><font>'+doc.f_count+'</font></td>';
					tr_html+='<td col_grp="B"><font>'+doc.b_count+'</font></td>';
					tr_html+='<td col_grp="E"><font>'+doc.e_count+'</font></td>';
					tr_html+='<td col_grp="I"><font>'+doc.i_count+'</font></td>';
					tr_html+='</tr>';
					$(tbody).append(tr_html);			
				}
			}
			// else
			// {
			// 	$("#table_tr_overview").attr("hidden","True");
			// }
			if(testruns.length>0){
				get_testrun_overview(testruns);
			}
			else{
				var amount=0;non=0,p=0,f=0,b=0,e=0,i=0;
				$("#table_tr_overview>tbody tr").each(function(){
					var elem_all = $(this).children("td[col_grp=All]");
					var elem_non = $(this).children("td[col_grp=N]");
					var elem_p = $(this).children("td[col_grp=P]");
					var elem_f = $(this).children("td[col_grp=F]");
					var elem_b = $(this).children("td[col_grp=B]");
					var elem_e = $(this).children("td[col_grp=E]");
					var elem_i = $(this).children("td[col_grp=I]");
					amount+=parseInt($(elem_all).text());
					non+=parseInt($(elem_non).text());
					p+=parseInt($(elem_p).text());
					f+=parseInt($(elem_f).text());
					b+=parseInt($(elem_b).text());
					e+=parseInt($(elem_e).text());
					i+=parseInt($(elem_i).text());
				});
				var tfoot = $("#table_tr_overview>tfoot");
				var tr_html='<tr>';
				tr_html+='<td></td>';
				tr_html+='<td>'+"Total"+'</td>';
				tr_html+='<td col_grp="All">'+amount+'</td>';
				tr_html+='<td col_grp="P,F,B,E,I">'+parseInt(amount-non)+'</td>';
				tr_html+='<td col_grp="N">'+non+'</td>';
				tr_html+='<td col_grp="P">'+p+'</td>';
				tr_html+='<td col_grp="F">'+f+'</td>';
				tr_html+='<td col_grp="B">'+b+'</td>';
				tr_html+='<td col_grp="E">'+e+'</td>';
				tr_html+='<td col_grp="I">'+i+'</td>';
				tr_html+='</tr>';
				$(tfoot).append(tr_html);
				if($("#table_tr_overview>tbody tr").length>0){
					$("#table_tr_overview").attr("hidden",null);
				}
				else{
					$("#table_tr_overview").attr("hidden","true");
				}
			}
		},
	});
}

function removeCookie(cname){
 	var d = new Date();
    d.setTime(0);
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=\"\";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function setCookie(cname, cvalue, exdays=1) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function set_tr_tc_filter(trid,tr_name="",documents="all",ary_verdicts=[],ary_auto=[],ary_tags=[]){
	//console.log("id="+trid+";name="+tr_name+";doc="+documents+";verdicts="+ary_verdicts.toString()+";automated="+ary_auto.toString()+";tags="+ary_tags.toString());
	$.ajax({
		url: 'php/testrun.php',
		type: 'POST',
		dataType: 'json',
		data: {
			"action":"set_tr_tc_filter",			
			"trid":trid,
			"tr_name":tr_name,
			"documents":documents,
			"verdicts": ary_verdicts,
			"automated":ary_auto,
			"tags":ary_tags
		},
		success: function(response) {
			if(response.result=="Pass"){
				var page_name=document.location.href.match(/[^\/]+$/)[0];
				setCookie("testrun_page_caller",page_name);
				window.location.replace("testrun.html");
			}
		}
	});
}

function __sortTable(table,index) {
	var rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0,val_x,val_y;
	switching = true;
	//Set the sorting direction to ascending:
	dir = "asc"; 
	/*Make a loop that will continue until
	no switching has been done:*/
	while (switching) {
		//start by saying: no switching is done:
		switching = false;
		rows = $(table).children("tbody").children("tr").toArray();
		/*Loop through all table rows (except the
		first, which contains table headers):*/
		for (i = 0; i < (rows.length-1); i++) {
			//start by saying there should be no switching:
			shouldSwitch = false;
			/*Get the two elements you want to compare,
			one from current row and one from the next:*/
			x = rows[i].getElementsByTagName("td")[index];
			y = rows[i + 1].getElementsByTagName("td")[index];
			val_x = parseInt($(x).text()) || $(x).text().toLowerCase();
			val_y = parseInt($(y).text()) || $(y).text().toLowerCase();
			/*check if the two rows should switch place,
			based on the direction, asc or desc:*/
			if (dir == "asc") {
				if (val_x > val_y) {
					//if so, mark as a switch and break the loop:
					shouldSwitch= true;
					break;
				}
			} 
			else if (dir == "desc"){
				if (val_x < val_y) {
					//if so, mark as a switch and break the loop:
					shouldSwitch = true;
					break;
				}
			}
		}
		if (shouldSwitch) {
			/*If a switch has been marked, make the switch
			and mark that a switch has been done:*/
			rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
			switching = true;
			//Each time a switch is done, increase this count by 1:
			switchcount ++;      
		} 
		else {
			/*If no switching has been done AND the direction is "asc",
			set the direction to "desc" and run the while loop again.*/
			if (switchcount == 0 && dir == "asc") {
				dir = "desc";
				switching = true;
			}
		}
	}
}

$(document).ready(function(){
	var str_trs = getCookie("multi_tr_query");
	var ary_testruns = JSON.parse(str_trs);
	if(ary_testruns && ary_testruns.length>0){
		// $("#table_tr_overview>tbody tr").remove();
		get_testrun_overview(ary_testruns);
	}

	//***************** tr_overview td clicked ***************** 
	$("#table_tr_overview").on("click","tbody td",function(){
		var grp = $(this).attr("col_grp");
		var count = parseInt($(this).text());
		if(grp!="Title" && grp!="TestRun"){
			if(count && count>0){
				var doc = $(this).siblings("td[col_grp=Title]:first").text();
				var testrun_ele =  $(this).siblings("td[col_grp=TestRun]:first");
				var trid = $(testrun_ele).attr("value");
				var tr_name = $(testrun_ele).text();
				var ary_verdicts = [];
				if(doc=="Total"){
					doc="all";
				}
				if(grp=="All"){
					//ary_verdicts = [];
					ary_verdicts.length=0;
				}
				else{
					//ary_verdicts = [];
					ary_verdicts = grp.split(",");
				}
				set_tr_tc_filter(trid,tr_name,doc,ary_verdicts);
			}
		}
	})
	.on("dblclick","thead th",function(th){
		var columns = $(this).parent().children("th").toArray();
		var index = columns.indexOf(this);
		__sortTable($("#table_tr_overview").get(0),index);
	})
	;

});