var osrsbaseURL="https://secure.runescape.com/m=itemdb_oldschool/api/catalogue/detail.json?item=";
var osrsboxbaseURL="https://api.osrsbox.com/items?where={\"name\":";
var si = [
{ value: 1, symbol: "" },
{ value: 1E3, symbol: "K" },
{ value: 1E6, symbol: "M" },
{ value: 1E9, symbol: "B" },
{ value: 1E12, symbol: "T" },
{ value: 1E15, symbol: "P" },
{ value: 1E18, symbol: "E" },
{ value: 1E18, symbol: "Z" },
{ value: 1E18, symbol: "Y" }
];


document.addEventListener('DOMContentLoaded', function() {
  document.getElementById("find").addEventListener("click", findItem);
});

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById("update").addEventListener("click", updateItems);
});

function getID(myarray){
  for(var x=0;x<myarray.length;x++){
    if(myarray[x]["duplicate"]===false && myarray[x]["placeholder"]===false && myarray[x]["noted"]===false){
      return myarray[x]["id"];
    }
  }
  return -1;
}

window.onload = async function() {
  var currTime = new Date().getTime()/1000;
  var staleTime = await getStorageValue('staleTime');
  if(typeof staleTime!=='undefined'){
    if(currTime-staleTime > 86400){
      updateItems();
    }else{
      showItems();
    }
  }else{
    showItems();
  }
}

async function updateItems(){
  var listItems=await getAllKeys();
  var currTime = new Date().getTime()/1000;
  var content = "<div style=\"text-align:center\"><span>&#x268B;</span><span style=\"--delay: 0.1s\">&#x268B;</span>";
  content = content + "<span style=\"--delay: 0.1s\">&#x268B;</span>";
  content = content + "<span style=\"--delay: 0.3s\">&#x268B;</span>";
  content = content + "<span style=\"--delay: 0.4s\">&#x268B;</span>";
  content = content + "<span style=\"--delay: 0.5s\">&#x268B;</span><div><h1 style=\"color:#474554\">Updating Prices</h1></div></div>";
  document.getElementsByTagName('body')[0].innerHTML = content;
  var myarray;
  var updated=false;
  for(itnm in listItems){
    if(itnm.includes("item")){
      myarray=listItems[itnm].split(">>>");
      let osrsResponse = await fetch(osrsbaseURL+myarray[1]);
      if(osrsResponse.ok){
        let osrsJson = await osrsResponse.json();
        var price = osrsJson["item"]["current"]["price"];
        var trend = osrsJson["item"]["today"]["trend"];
        var trendPrice = osrsJson["item"]["today"]["price"];
        var dataobj={};
        dataobj[itnm]=myarray[0]+'>>>'+myarray[1]+'>>>'+price+'>>>'+myarray[3]+'>>>'+trend+'>>>'+trendPrice+'>>>'+myarray[6];
        chrome.storage.sync.set(dataobj);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }else{
        document.getElementById("Error").style.display="inherit";
        console.log("HTTP-Error: " + osrsResponse.status);
      }
    }
  }
  chrome.storage.sync.set({'staleTime': currTime});
  location.reload();
}

async function showItems(){
  var items = document.getElementById("itemBody");
  var temp = items.innerHTML;
  var item;
  var myarr;
  var img;
  var price;
  var exists;
  var onClickarr=[];
  var itnm;
  var listItems=await getAllKeys();
  var prices;
  var trend;
  var bought;
  var span;
  for(itnm in listItems){
    if(itnm.includes("item")){
      exists = document.getElementById(itnm);
      item = listItems[itnm];
      myarr = item.split(">>>");
      if(!exists){
        onClickarr.push(itnm);
        img = "<img src=\""+myarr[3]+"\""+" alt=\"osrs item\">";
        price = "<h3>"+myarr[2]+"</h3>";
        bought = "<h3 style=\"color:" + comparePrices(myarr[2],myarr[6]) + "\">" + formatPrice(myarr[6])+"</h3>";
        if(myarr[4]==="negative"){
          trend = "<div class=\"trend\"><p class=\"negative\">&#x2193;</p>"+"<h3>"+myarr[5]+"</h3></div>";
        }
        if(myarr[4]==="positive"){
          trend = "<div class=\"trend\"><p class=\"positive\">&#x2191;</p>"+"<h3>"+myarr[5]+"</h3></div>";
        }
        if(myarr[4]==="neutral"){
          trend = "<div class=\"trend\"><p class=\"neutral\">&ndash;</p>"+"<h3>"+myarr[5]+"</h3></div>";
        }
        temp = temp + "<div id=\"" + itnm + "\" title=\"" + myarr[0] + "\"" + ">" + img + price + bought + trend + "</div>";
      }
    }
  }
  items.innerHTML = temp;
  assignOnClick(onClickarr);
}

function formatPrice(mystr){
  if(!mystr.includes('n/a')){
    var fullNum = getFullNumber(mystr);
    var rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    var i;
    for (i = si.length - 1; i > 0; i--) {
      if (fullNum >= si[i].value) {
        break;
      }
    }
    return (fullNum / si[i].value).toFixed(1).replace(rx, "$1") + si[i].symbol;
  }
  return "n/a";
}

function getFullNumber(mystr){
  mystr = mystr.trim();
  var retme;
  if(mystr==='n/a'){
    return -1;
  }else if(isNaN(mystr*1)){
    var mult = mystr.charAt(mystr.length-1);
    switch(mult) {
      case 'm':
        retme = 1e6;
        break;
      case 'b':
        retme = 1e9;
        break;
      case 'k':
        retme = 1e3;
        break;
      default:
        retme = -1;
    }
    return mystr.slice(0,mystr.length-1) * 1 * retme;
  }else{
    return mystr * 1;
  }
  return -1;
}

function comparePrices(str1, str2){
  if(getFullNumber(str2)<=-1){
    return "black";
  }else if(getFullNumber(str1) < getFullNumber(str2)){
    return "red";
  }else if(getFullNumber(str1) > getFullNumber(str2) ){
    return "green";
  }else{
    return "yellow";
  }
}

function assignOnClick(arr){
  for(var i=0;i<arr.length;i++){
    document.getElementById(arr[i]).addEventListener("click", deleteItem);
  }
}

async function deleteItem(e){
  var el = document.getElementById( e.path[1].id );
  if(el!==null){
    el.parentNode.removeChild(el);
    chrome.storage.sync.remove(e.path[1].id);
    var numit = await getStorageValue('numItems');
    chrome.storage.sync.set({'numItems': numit-1});
    if(numit===1){
      chrome.storage.sync.remove('staleTime');
    }
  }
}

async function getStorageValue(key) {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.sync.get(key, function (value) {
                resolve(value[key]);
            })
        }
        catch (ex) {
            reject(ex);
        }
    });
}

async function getAllKeys(key=null) {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.sync.get(key, function (value) {
                resolve(value);
            })
        }
        catch (ex) {
            reject(ex);
        }
    });
}

function verifyInput(mystr){
  var matches = mystr.match(/((\w+(\W\w)?[" "]*)+(\((\w+|\d+)\))?)[" "]*(::)?[" "]*(\d{1,10}(\.\d{1})?(k|m|b)?)?/);
  return matches;
}

function capitalize(mystr){
  return mystr.charAt(0).toUpperCase() + mystr.slice(1);
}

async function findItem() {
  var currentItems = await getStorageValue('numItems');
  var currTime = new Date().getTime()/1000;
  if((currentItems)<=12){
    var getItem = document.getElementById('itemname').value;
    var verify = verifyInput(getItem);
    var findItemInput = [capitalize(verify[1])];
    if(typeof verify[7]!=="undefined"){
      findItemInput.push(verify[7].trim());
    }
    var item=osrsboxbaseURL+"\""+encodeURIComponent(findItemInput[0])+"\"}";
    let response = await fetch(item);
    if (response.ok) {
      let json = await response.json();
      var id = getID(json["_items"]);
      if(id!==-1){
        var osrsReq=osrsbaseURL+id;
        let osrsResponse = await fetch(osrsReq);
        if(osrsResponse.ok){
          let osrsJson = await osrsResponse.json();
          var price = osrsJson["item"]["current"]["price"];
          var icon = osrsJson["item"]["icon"];
          var trend = osrsJson["item"]["today"]["trend"];
          var trendPrice = osrsJson["item"]["today"]["price"];
          var dataobj={};
          var itemID = "item"+id;
          var storeMe = findItemInput[0]+'>>>'+id+'>>>'+price+'>>>'+icon+'>>>'+trend+'>>>'+trendPrice;
          if(findItemInput.length===2){
            storeMe = storeMe + '>>>' + findItemInput[1];
          }else{
            storeMe = storeMe + '>>>n/a';
          }
          dataobj[itemID]=storeMe;
          chrome.storage.sync.set({'numItems': currentItems+1});
          if(currentItems===0){
            chrome.storage.sync.set({'staleTime': currTime});
          }
          chrome.storage.sync.set(dataobj);
          location.reload();
        }else{
          document.getElementById("Error").style.display="inherit";
          console.log("HTTP-Error: " + osrsResponse.status);
        }
      }else{
        document.getElementById("notFound").style.display="inherit";
        console.log("item not found");
      }
    }else {
      document.getElementById("Error").style.display="inherit";
      console.log("HTTP-Error: " + response.status);
    }
  }
}
