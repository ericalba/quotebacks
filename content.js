document.addEventListener('keydown', function(event) {
//  cmd + shift + S
  if (event.metaKey && event.shiftKey && event.which === 83) {
    
    var object = {};

    var text = getSelectionText();  
    var page = document.location.href;    

    chrome.storage.local.get([page], function(result) {

        var page_object = {};        
        // page_object["date"] = getDate(); needs to get attached to each quote item
        page_object["url"] = page;
        page_object["title"] = document.title;
        page_object["author"] = getMeta("author");

        var quotes = [];
        var quote = {};

        quote["text"] = text;
        quote["date"] = getDate();

        quotes.push(quote);

        if(result[page] == null){
            var combined = quotes;
        }
        else{
            var combined = quotes.concat(result[page]["quotes"])
        }

        page_object["quotes"] = combined;
        
        object[page] = page_object; 

        chrome.storage.local.set(object, function() {            
            console.log(object[page]["quotes"][0]);

            var browser_page = chrome.runtime.getURL("options.html");

            window.getSelection().anchorNode.parentNode.insertAdjacentHTML( 'afterbegin', "<div class='tomtobypopup' id='tomtobyid'><div><div class='tomtobytext'>"+text.substring(1,50)+"</div><textarea rows='4'></textarea><div class='tomtobysaved'>Saved</div><div class='tomtobybutton'><a href='"+browser_page+"#"+page+"'>See Quotes</div></div></div>" );
            
            var time = 0;
            var textfocus = false;
            var ishover = false;
            var isPaused = false;
            txtAreaListenFocus();
            txtAreaListenBlur();

            let popup = document.querySelector(".tomtobypopup");
  
            popup.addEventListener("mouseover", function( event ) {   
                ishover = true;
            });

            popup.addEventListener("mouseout", function( event ) {   
                ishover = false;
            });

            AutoSave.start(object);

            var t = window.setInterval(function() {

                if(!ishover && !textfocus) {
                  time++;
                  if(time > 5){
                    var paras = document.getElementsByClassName('tomtobypopup');
                    while(paras[0]) {
                        paras[0].parentNode.removeChild(paras[0]); // remove all popups
                    };         
                    AutoSave.stop();              
                    clearInterval(t); // stop timer
                  };
                  console.log(time + "is hover: "+ishover + "is textfocus:"+textfocus);
                }

              }, 1000);

              function txtAreaListenFocus(){
                var txtArea = document.querySelector('.tomtobypopup textarea');
                txtArea.addEventListener('focus', function(event) {
                   textfocus = true;
                }.bind(this));
              };

              function txtAreaListenBlur(){
                var txtArea = document.querySelector('.tomtobypopup textarea');
                txtArea.addEventListener('blur', function(event) {
                  textfocus = false;
                }.bind(this));
              };


          });

      });

    }
  });

  

function getSelectionText() {
    var text = "";
    if (window.getSelection) {
    
      // from here: https://gist.github.com/gleuch/2475825
      // selection range
      var range = window.getSelection().getRangeAt(0);

      // plain text of selected range (if you want it w/o html)
      var text = window.getSelection();
          
      // document fragment with html for selection
      var fragment = range.cloneContents();

      // make new element, insert document fragment, then get innerHTML!
      var div = document.createElement('div');
      div.appendChild( fragment.cloneNode(true) );

      // your document fragment to a string (w/ html)! (yay!)
      var text = div.innerHTML;
      console.log(text);


    } else if (document.selection && document.selection.type != "Control") { // think this is for IE?
    text = document.selection.createRange().text;
    }
    return text;
};

function getMeta(metaName) {
    const metas = document.getElementsByTagName('meta');
  
    for (let i = 0; i < metas.length; i++) {
      if (metas[i].getAttribute('name') === metaName) {
        return metas[i].getAttribute('content');
      }
    }
  
    return '';
  };

function getDate(){
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = today.getFullYear();
  
  today = mm + '/' + dd + '/' + yyyy;
  return today;
};

// From: https://gist.github.com/gcmurphy/3651776
var AutoSave = (function(){

    var timer = null;
    
	function getEditor(){
		var elems = document.querySelector(".tomtobypopup textarea")
		if (!elems)
			return null;
		return elems;
	}

	function save(object){
        console.log("running save");
		var editor = getEditor(); 
            if (editor) {
            
                //localStorage.setItem("AUTOSAVE_" + document.location, editor.value )

            var page = document.location.href;

            object[page]["quotes"][0]["comment"] = editor.value;
            chrome.storage.local.set(object, function() { 
                console.log("autosaved");
            });
            }
        };

	function restore(){ //don't think I actually need this restore function...?
        var page = document.location.href;
        var saved = "";
        chrome.storage.local.get([page], function(result) {
            saved = result[page]["quotes"][0]["comment"];
        });
        //var saved = localStorage.getItem("AUTOSAVE_" + document.location)
		var editor = getEditor();
		if (saved && editor){
			editor.value = saved; 
		}
	}

	return { 

		start: function(object){

            var editor = getEditor(); 
            console.log(editor);

			if (editor.value.length <= 0)
				restore();

			if (timer != null){
				clearInterval(timer);
				timer = null;
			}
			timer = setInterval(function(){
                save(object)
            }, 1000);
		},

		stop: function(){

			if (timer){ 
				clearInterval(timer);
				timer = null;
			}

		}
	}

}());
