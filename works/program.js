var date = scenario.split("##");
var n = 0;

function going() {
  scene = date[n].split(",");
  document.getElementById("character").innerHTML = scene[0];
  document.getElementById("message").innerHTML = scene[1];
  n += 1;
}
going();

document.onkeyup = function() {
  if(event.keyCode == 13){
    going();
  }
}