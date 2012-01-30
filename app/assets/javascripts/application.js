// This is a manifest file that'll be compiled into including all the files listed below.
// Add new JavaScript/Coffee code in separate files in this directory and they'll automatically
// be included in the compiled file accessible from http://example.com/assets/application.js
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// the compiled file.
//
//= require adapt.min
//= require jquery
//= require jquery-ui
//= require jquery_ujs
//= require jquery/jquery.chosen
//= require jquery/jquery.bind-with-delay
//= require jquery/jquery.observer
//= require jquery/jquery.inline-labels
//= require jquery/jquery.elastic
//= require jquery/jquery.reject.min
//= require raphael/raphael-min
//= require raphael/g.raphael-min
//= require raphael/g.pie-min
//= require jquery/jquery.facebox
//= require jquery/jquery.placeholder
//= require contacts
//= require mailing_lists
//= require roles
//= require upgrades
//= require users
//
//not for now: //= require_tree .

//TODO: move everything below to separate javascript files

// ajax loader
$(function() {
  // show #loading element
  $('#loading').ajaxStart(function() { $(this).fadeIn(150); })
               .ajaxStop(function() { $(this).fadeOut(150); });
  // but not for rails' automatic $.ajax calls
  $.rails.ajax = function(options) {
    return $.ajax($.extend(options, {global: false}));
  }
});

// application events
$(function() {
  //table sorting
  $(".items_list th a, .sort_by a").live("click", function(e) {
    $.getScript(this.href);
    //fallback for old browsers
    if (!('pushState' in window.history)) return true
    //ensure middle, control and command clicks act normally
    //if (e.which == 2 || e.metaKey || e.ctrlKey) return true
    //push history!
    history.pushState(null, document.title, this.href);
    e.preventDefault();
  });

  //server 'virtual' toggling
  $('#server_virtual').live('change', function(e) {
    $('.hidden-if-virtual, .hidden-if-physical').toggleClass("virtual");
    if ($('input#server_virtual').attr('checked') == true) {
      $('#server-hardware-title').html("Ressources");
    } else {
      $('#server-hardware-title').html("Matériel");
    }
  });

  //more buttons
  $('.more').live('click', function(e) {
    $(this).parent().next().slideToggle(100);
    e.preventDefault();
  });
  $('.more-next').live('click', function(e) {
    $(this).next().slideToggle(100);
    e.preventDefault();
  });
  $('.more-child').live('click', function(e) {
    $(this).find('.hidden').slideToggle(100);
    e.preventDefault();
  });
  $('.more-child a').live('click', function(e) {
    e.stopPropagation();
  });

  //filters observer
  submitFilters = function() {
    $.get($("#filters").attr("action"), $("#filters").serialize(), null, "script");
    //fallback for old browsers
    if (!('replaceState' in window.history)) return true
    //push our search to history
    var filters = jQuery.param( jQuery.grep( $('#filters').serializeArray(), function(o){ return o.name != "utf8" && o.value != "" } ) )
    var url = $("#filters").attr("action").split("?")[0] + "?" + filters
    history.replaceState(null, document.title, url);
  }
  $(".filters input").each(function() {
    this.previousLength = this.value.length;
  });
  $(".filters input").bindWithDelay("keyup", function(e) {
    elem = e.currentTarget;
    if (elem.previousLength != elem.value.length) {
      elem.previousLength = elem.value.length;
      submitFilters();
    }
  }, 300);
  $(".filters select, .filters input[type='checkbox']").change(submitFilters);

  //back button for pushState's
  $(window).bind("popstate", function() {
    //commented out since it makes calls to ".js"'s urls even when not necessary at all (welcome page for instance)
    //TODO: switch to jquery-pjax ftw!
    //$.getScript(location.href);
  });

  //multiselect with chosen plugin
  enableChosenFields();

  //hide alert messages
  $('#flash').delay(4000).slideUp(300); 

  //faceboxes
  $('a[rel*=facebox]').facebox();
});

// context
$(function(){
  $(".contextswitch").click(function(e){
    var a=$(this), d=a.closest(".toggle");
    if (a.hasClass("activated")) {
      a.removeClass("activated");
    } else {
      a.addClass("activated");
      e.stopPropagation();
      $(document).one("click", {contextSwitch: a}, function(e){ e.data.contextSwitch.removeClass("activated"); });
    }
  })
});

// treat radio buttons for server type as checkboxes
$(function(){
  $('.checkboxes-as-radio .radio-checkbox').live('change', function() {
    if ($(this).is(":checked")) {
      //remember the id of checked checkbox
      var id = $(this).attr("id");
      $(this).closest('.checkboxes-as-radio').find('.radio-checkbox').each(function() {
        //uncheck other checkboxes
        if ($(this).attr("id") != id && $(this).attr("checked") == "checked") {
          $(this).click();
        }
      });
    }
  });
});

// nested forms
function remove_fields(link) {
  $(link).prev("input[type=hidden]").val("1");
  $(link).closest(".fields").hide();
}

function add_fields(link, association, content) {
  var new_id = new Date().getTime();
  var regexp = new RegExp("new_" + association, "g")
  $(link).parent().before(content.replace(regexp, new_id));
  enableChosenFields();
}

// elastic <textarea>'s
$(function() {
  $('textarea').elastic().unbind('blur');
});

//fixed table column sizes
function fixTableHeaders() {
  $('.fix-on-scroll').each(function() { initializeTopOffset(this); });
  $('.fixed-size, .fix-on-scroll').children().each(function() { fixElementSize($(this)); });
  $('td.multirow').siblings().andSelf().each(function() { fixElementSize($(this)); });
}
function fixElementSize(elem) {
  elem.css('width', parseInt(elem.innerWidth()) - parseInt(elem.css('paddingLeft')) - parseInt(elem.css('paddingRight')));
}
function initializeTopOffset(elem) {
  elem.initialTopOffset = $(elem).offset().top; // - parseFloat($(elem).css('marginTop').replace(/auto/, 0));
}

$(window).load(function() {
  //fix table headers one time after everything is loaded
  fixTableHeaders();

  //fix headers on scroll
  $(window).scroll(function (event) {
    fixHeadersOnScroll();
  });
  //fix headers once everything is loaded (in case we're not at the top)
  fixHeadersOnScroll();

  function fixHeadersOnScroll() {
    // what the y position of the scroll is
    var y = $(window).scrollTop();
    $('.fix-on-scroll').each(function() {
      // whether that's below the form
      if (y >= this.initialTopOffset) {
        // if so, ad the fixed class
        $(this).addClass('fixed');
      } else {
        // otherwise remove it
        $(this).removeClass('fixed');
      }
    });
  }
});

//top menu items
$(function() {
  var otherOpen = false;
  $('.has-submenu:not(.active)>a').live('click', openSubMenu);
  $('.has-submenu:not(.active)>a').live('mouseenter', openSubMenuIfOtherOpen);
  $('.has-submenu.active>a').live('click', closeAllSubMenus);
  function openSubMenu(event) {
    closeAllSubMenus();
    var button = $(this).parent().addClass('active');
    var menu = $(this).children('div');
    menu.addClass('active')
        .click(function(e) { e.stopPropagation(); })
    $(document).one('click', {button: button}, closeSubMenu);
    otherOpen = true;
    return false;
  }
  function openSubMenuIfOtherOpen(event) {
    if (otherOpen) { $(this).trigger('click'); }
  }
  function closeSubMenu(event) {
    if (!$(event.target).hasClass("submenu") && !$(event.target).closest('.has-submenu').hasClass('active')) {
      event.data.button.removeClass('active');
      otherOpen = false;
    } else {
      $(document).one('click', {button: event.data.button}, closeSubMenu);
    }
  }
  function closeAllSubMenus() {
    $('.has-submenu').removeClass('active');
    otherOpen = false;
    return false;
  }
});

//enable multiselects with harvesthq's chosen
function enableChosenFields() {
  $(".chzn-select").chosen();
  $(".chzn-select-deselect").chosen({allow_single_deselect:true});
}
