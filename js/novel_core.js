/* global $ Game Key */

var myGame;
$(document).ready(function() {
    myGame = new Game("myGame");
    myGame.config = "config.conf";
    myGame.updateFunction = updateGame;
    myGame.drawFunction = drawGame;
    myGame.KeyDown = Game_KeyDown;
    myGame.Initialize();
    initGame();
});

/*
0: 色
1: 色~背景
2: 背景
*/
var drawMode = 0;
var opacity = 0;
var boardOp = 0;
var boardComp = false;
var novelConfig = "conf/novel.conf";
var background_name = "roka";
var maskbground_name = "mask";


var serif_script = "";
var readLine = 0;
var debugy = true;

var personObj = {};
var imageData = {};

var initGame = function () {
    $.ajax({
        url: novelConfig,
        async: false,
        success: function(j){
            novelConfig = $.parseJSON(j);
        }
    });
    
    //画像の一斉ロード
    $.each(novelConfig.background, function(k, v) {
        $('canvas').drawImage({
            source: v,
            x: 600, y:  300,
            opacity: opacity
        });
        debug("load: "+k);
    });
    $.each(novelConfig.maskbgimage, function(k, v) {
        $('canvas').drawImage({
            source: v,
            x: 600, y:  300,
            opacity: opacity
        });
        debug("load: "+k);
    });
    $.each(novelConfig.person, function(k, v) {
        $('canvas').drawImage({
            source: v,
            x: 600, y:  300,
            opacity: opacity
        });
        imageData[k] = {};
        imageData[k]["img"] = new Image();
        imageData[k]["img"].src = v;
        imageData[k]["width"] = imageData[k]["img"].width;
        imageData[k]["height"] = imageData[k]["img"].height;
        debug("load: "+k);
    });
    
    //セリフスクリプトロード
    $.ajax({
        url: novelConfig.serif,
        async: false,
        success: function(txt){
            serif_script = txt.split("\n");
        }
    });
    
    personObj["person"] = {};
};

var updateGame = function() {
    //更新
    
    //不透明度
    $(personObj["person"]).each(function(i, v) {
        for (var k in v) {
            var addT = v[k].opacity < v[k].maxcity;
            v[k].opacity += addT ? v[k].addcity : -v[k].addcity;
            if ((addT && v[k].opacity >= v[k].maxcity) ||
                (!addT && v[k].opacity <= v[k].maxcity)) {
                    v[k].opacity = v[k].maxcity;
                }
        }
    });
};

var drawGame = function() {
    //描写
    
    
    //背景とボード
    switch (drawMode) {
        case 0:
            $('canvas').drawRect({
                fillStyle: novelConfig.color,
                x: 600, y: 300,
                width: 1200,
                height: 600,
                opacity: 1 - opacity
            });
            break;
        case 1:
            opacity += 0.1;
            if (opacity >= 1) {
                opacity = 1;
                drawMode = 2;
            }
            $('canvas').drawRect({
                fillStyle: novelConfig.color,
                x: 600, y: 300,
                width: 1200,
                height: 600,
                opacity: 1 - opacity
            });
            $('canvas').drawImage({
                source: getBackSRC(background_name),
                x: 600, y:  300,
                width: 1200,
                opacity: opacity
            });
            if (novelConfig.maskVisible)
                $('canvas').drawImage({
                    source: getMaskSRC(maskbground_name),
                    x: 600, y:  300,
                    width: 1200,
                    opacity: opacity
                });
            break;
        case 2:
            $('canvas').drawImage({
                source: getBackSRC(background_name),
                x: 600, y:  300,
                width: 1200,
                opacity: opacity
            });
            if (novelConfig.maskVisible)
                $('canvas').drawImage({
                    source: getMaskSRC(maskbground_name),
                    x: 600, y:  300,
                    width: 1200,
                    opacity: opacity
                });
            break;
        default:
            // code
    }
    
    if (drawMode >= 2) {
        $(personObj["person"]).each(function(i, v) {
            for (var k in v) {
                var target = v[k].target;
                if (target != undefined) {
                    var scale = 0.8;
                    $('canvas').drawRect({
                        fillStyle: novelConfig.color,
                        x: i == 0 ? 300 : 900, y:  600 - scale * imageData[target].height / 2,
                        width: imageData[target].width * scale, height: imageData[target].height * scale,
                        opacity: 0.2
                    });
                    debug({x: i == 0 ? 300 : 900, y:  600 - scale * imageData[target].height / 2,
                        width: imageData[target].width * scale, height: imageData[target].height * scale,
                        opacity: 0.2});
                    $('canvas').drawImage({
                        source: novelConfig.person[target],
                        x: i == 0 ? 300 : 900, y:  600 - scale * imageData[target].height / 2,
                        width: imageData[target].width * scale, height: imageData[target].height * scale,
                        opacity: v[k].opacity
                    });
                }
                i++;
            }
        });
        boardOp = boardOp >= 0.8 ? 0.8 : boardOp + 0.1;
        boardComp = boardOp >= 0.8;
        $('canvas').drawRect({
            fillStyle: novelConfig.color,
            x: 600, y: 500,
            width: 1100,
            height: 150,
            opacity: boardOp
        });
        
        var t_name = personObj.name != undefined ? personObj.name : "";
        var t_serif = personObj.name != undefined ? personObj.serif : "";
        
        //名前
        $('canvas').drawText({
            fillStyle: '#fff',
            strokeStyle: '#555',
            strokeWidth: 1,
            x: 100, y: 440,
            maxWidth: 1100,
            fontSize: 24,
            fontFamily: 'Noto Sans Japanese',
            align: 'left',
            text: t_name
        });
        
        //セリフ
        $('canvas').drawText({
            fillStyle: '#fff',
            strokeStyle: '#555',
            strokeWidth: 1,
            x: 60, y: 500,
            maxWidth: 1100,
            fontSize: 24,
            fontFamily: 'Noto Sans Japanese',
            align: 'left',
            respectAlign: true,
            text: t_serif
        });
    }
};

var Game_KeyDown = function(key) {
    if (key.keyCode == Key.SPACE && drawMode == 0) {
        drawMode = 1;
        opacity = 0;
    } else if (key.keyCode == Key.SPACE) {
        var loop = true;
        while(loop) {
            readScript();
            if (personObj["option"] == undefined || personObj["option"] == "#hide"){
                loop = false;
            } 
        }
    }
        
};

function getBackSRC(backName) {
    return novelConfig.background[backName];
}

function getMaskSRC(maskName) {
    return novelConfig.maskbgimage[maskName];
}

function debug(log) {
    if (debugy)
        console.log(log);
}

function readScript() {
    var t_scr = serif_script[readLine];
    t_scr = t_scr.split("");
    var checkMode = 0;
    var prechMode = 0;
    var targetPNum = "";
    var t_scr_len = t_scr.length;
    personObj["name"] = undefined;
    personObj["serif"] = undefined;
    personObj["option"] = undefined;
    $(t_scr).each(function (i, t) {
        
            
        if (i == 0 && t == "#") {
            prechMode = checkMode;
            checkMode = 3;
        }
        if (t == "\"" && checkMode < 99) {
            prechMode = checkMode;

            if (personObj["name"] == undefined && checkMode != 1)
                checkMode = 1;
            else if (personObj["name"] != undefined && checkMode == 1)
                checkMode = 0;
            else if (personObj["name"] == undefined && checkMode == 1) {
                personObj["name"] = "";
                checkMode = 0;
            }
            else if (personObj["name"] != undefined && checkMode != 2)
                checkMode = 2;
            else if (personObj["serif"] != undefined && checkMode == 2)
                checkMode = 0;
            else if (personObj["serif"] == undefined && checkMode == 2) {
                personObj["serif"] = "";
                checkMode = 0;
            }
        }
        else if (t == "," && checkMode < 99) {
            prechMode = checkMode;
            checkMode = prechMode >= 3 ? prechMode + 1 : 0;
            if (checkMode == 5) {
                if (personObj["person"][targetPNum] == undefined)
                    personObj["person"][targetPNum] = {};
                personObj["person"][targetPNum]["target"] = undefined;
            }
        }
        else if (t == "\\" && checkMode < 99) {
            prechMode = checkMode;
            checkMode = 99;
        }
        else {
            
            if (checkMode == 99) {
                checkMode = prechMode;
                prechMode = 99;
            }
            if (t == "\\") {
                t = "\n";
            }
            if (checkMode == 1) 
                pushOne("name", t);
            if (checkMode == 2) 
                pushOne("serif", t);
            if (checkMode == 3) {
                pushOne("option", t);
            }
            if (checkMode == 4) {
                if (t != " " && (t=="0"||t=="1"||t=="2"||t=="3"||t=="4"||t=="5"||t=="6"||t=="7"||t=="8"||t=="9"))
                    targetPNum += t;
                if (t_scr_len - 1 == i) {
                    checkMode = 5;
                }
            }
            if (checkMode == 5) {
                switch (personObj["option"]) {
                    case '#show':
                        pushPersonOne(targetPNum, "target", t);
                        personObj["person"][targetPNum]["opacity"] = 0;
                        personObj["person"][targetPNum]["addcity"] = 0.1;
                        personObj["person"][targetPNum]["maxcity"] = 0.5;
                        break;
                    case '#spot':
                        $(personObj["person"]).each(function(i, v) {
                            for (var k in v) {
                                personObj["person"][k]["maxcity"] = targetPNum == k ? 1 : 0.5;
                            }
                        });
                        break;
                    case '#hide':
                        personObj["person"][targetPNum]["addcity"] = 0.1;
                        personObj["person"][targetPNum]["maxcity"] = 0;
                        break;
                    default:
                        // code
                }
            }
        }
    });
    debug(personObj)
    ++readLine;
    if (readLine >= serif_script.length) {
        readLine = serif_script.length - 1;
    }
}

function pushOne(key, value) {
    if (personObj[key] == undefined)
        personObj[key] = value;
    else if (personObj[key] == "" && value == " ") {
        //最初の空白は無視
    } else {
        personObj[key] += value;
    }
}

function pushPersonOne(person_number, key, value) {
    if (personObj["person"][person_number] == undefined)
        personObj["person"][person_number] = {};
    if (personObj["person"][person_number][key] == undefined)
        personObj["person"][person_number][key] = "";
    if (personObj["person"][person_number][key] == "" && value == " ") {
        //最初の空白は無視
    } else {
        personObj["person"][person_number][key] += value;
    }
}