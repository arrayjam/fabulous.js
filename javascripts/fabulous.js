$(function() {

  var title = $(".split-and-fabulousize");

  var replacers = title.text().trim().split("").map(function(letter) { return $("<span>").text(letter); });
  title.html(replacers);
  $(".whee").on("click", function() { window.getSelection().selectAllChildren(document); });
  $("section").fabulous(10);
});
