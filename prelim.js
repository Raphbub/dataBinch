/*!
 * Simple Age Verification (https://github.com/Herudea/age-verification))
 */

var modal_content,
modal_screen;


// Start Working ASAP.
$(document).ready(function() {
	av_showmodal();

	$('#valider').click( function() {
	  var selectedVille = $('#city-list').val()
	    console.log(selectedVille);
	av_closeModal();

	  });

});


av_showmodal = function() {
	modal_screen = $('<div id="modal_screen"></div>');
	modal_content = $('<div id="modal_content" style="display:none"><h2>Quelle ville ?</h2>');
	var modal_content_wrapper = $('<div id="modal_content_wrapper" class="content_wrapper"></div>');

	// Question Content
	var content_heading = $('modal_content.h2');
	var content_text = $('#filtercity')
	var content_button = $('#validerbutton')
	modal_content_wrapper.append(content_heading,content_text,content_button);
	modal_content.append(modal_content_wrapper);
	// Append the prompt to the end of the document
	$('body').append(modal_screen, modal_content);
	// Center the box
	av_positionPrompt();
};


av_closeModal = function() {
	modal_content.fadeOut();
	modal_screen.fadeOut();

};

av_positionPrompt = function() {
	var top = ($(window).outerHeight() - $('#modal_content').outerHeight()) / 2;
	var left = ($(window).outerWidth() - $('#modal_content').outerWidth()) / 2;
	modal_content.css({
		'top': top,
		'left': left
	});
	if (modal_content.is(':hidden')) {
		modal_content.fadeIn('slow')
	}
};
