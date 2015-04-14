$(document).ready(function() {
    url = "https://widgets.thetyee.ca/progress.json?cb=?&campaign=election2015&date_end=2015-04-14&goal=75000&date_start=2015-03-20&multiplier=3";

    $.getJSON(url, function(data) {
        updateResults(data, 'once');
    });

    var progress = setInterval(function() {
        /* query the completion percentage from the server */
        $.getJSON(url, function(data) {
            updateResults(data, 'update');
        });
    }, 5000);

    function updateResults(data, mode) {
        var result = data.result;
        var left_days = result.left_days >= 1 ? result.left_days : 0;
        var left_hours = result.left_hours >= 1 ? result.left_hours : 0;
        var left_mins = result.left_mins >= 1 ? result.left_mins : 0;

        $(".goal").text(result.goal_formatted);
        $(".percentage").text(result.percentage);
        $(".count").text(result.people);
        $(".remaining").text(result.remaining);
        $(".progress-bar").css('width', result.percentage + '%');
        $(".progress-bar").attr('aria-valuenow', result.percentage);
        $(".progress-bar").attr('aria-valuemin', 0);
        $(".progress-bar").attr('aria-valuemax', result.goal);
        if (left_days > 1) {
            $(".days").html(left_days);
            $("i.days-left").html("days left");
        } else if (left_days == 1) {
            $(".days").html(left_days);
            $("i.days-left").html("day left");
        }
        if (left_days === 0) {
            $(".hours").html('<span class="hour"">' + left_hours + '</span> hours, ');
            $(".minutes").html('<span class="minute">' + left_mins + '</span> minutes remaining.');
        }
        if (mode == 'once') {
            $({
                countNum: $('span.amount').text()
            }).animate({
                countNum: result.raised
            }, {
                duration: 4000,
                easing: 'linear',
                step: function() {
                    $('.amount').text(FormatNumberBy3(Math.floor(this.countNum), ".", ","));
                }
            });
            $.each(result.contributors, function(index, c) {
                $('ul.contributor-list').append('<li id="' + index + '">' + c.name + ', ' + c.city + ', ' + c.state + '</li>');
            });
            $.each(result.votes, function(index, v) {
                if (v === null) {
                    return 'continue'; // Bad API design. TODO fix in widgets.thetyee.ca
                } else {
                    $('ul.priorities').append('<li id="' + index + '"><span class="badge">' + v.count + ' votes</span> ' + v.name + '</li>');
                }
            });
            // Don't need this for now...
            //if (result.left_days < 1 && result.left_hours < 1 && result.left_mins < 1) {
            //$("#campaign-end").html('<p class="alert alert-warning">The campaign is now over but you can still join The Tyee and help bring more great independent journalism to national issues. Thanks to all who signed up.</p>');
            //} else if (result.left_days === 0) {
            //$("#campaign-end").html('<p class="alert alert-warning">Campaign ends tonight at midnight!</p>');
            //}
        } else if (mode === 'update') {
            $(".amount").text(FormatNumberBy3(result.raised, ".", ","));
            $('.contributor-list li:first').slideUp(function() {
                $(this).appendTo($('.contributor-list')).slideDown();
            });
            $('ul.priorities li').remove();
            $.each(result.votes, function(index, v) {
                if (v === null) {
                    return 'continue'; // Bad API design. TODO fix in widgets.thetyee.ca
                } else {
                    $('ul.priorities').append('<li id="' + index + '"><span class="badge">' + v.count + ' votes</span> ' + v.name + '</li>');
                }
            });
            if (result.percentage > 100) {
                clearInterval(progress);
                $(".progress-bar").html('<span class="complete-msg">We did it!</span>');
                $('.remaining').text('$0');
            }
        }
    }

    $.getJSON("https://widgets.thetyee.ca/builderlist.json?date_start=2015-03-20&cb=?", function(data) {
        var result = data.result;
        var builders = result.builderlist;
        var last = builders.pop();
        var count = result.count;
        $("#builder-count").text(FormatNumberBy3(count, ".", ","));
        if (builders.length >= 1) {
            $.each(builders, function(index, c) {
                $('#builder-list ul').append('<li id="' + index + '">' + c.first_name + ' ' + c.last_name + '</li>');
            });
            $("#builder-list ul").append('<li class="last"> and ' + last.first_name + ' ' + last.last_name + '</li>');
        } else { // We only have one so far! 
            $("#builder-list ul").append('<li class="last">' + last.first_name + ' ' + last.last_name + '</li>');
        }
    });

});

function FormatNumberBy3(num, decpoint, sep) {
    // check for missing parameters and use defaults if so
    if (arguments.length == 2) {
        sep = ",";
    }
    if (arguments.length == 1) {
        sep = ",";
        decpoint = ".";
    }
    // need a string for operations
    num = num.toString();
    // separate the whole number and the fraction if possible
    a = num.split(decpoint);
    x = a[0]; // decimal
    y = a[1]; // fraction
    z = "";


    if (typeof(x) != "undefined") {
        // reverse the digits. regexp works from left to right.
        for (i = x.length - 1; i >= 0; i--)
            z += x.charAt(i);
        // add seperators. but undo the trailing one, if there
        z = z.replace(/(\d{3})/g, "$1" + sep);
        if (z.slice(-sep.length) == sep)
            z = z.slice(0, -sep.length);
        x = "";
        // reverse again to get back the number
        for (i = z.length - 1; i >= 0; i--)
            x += z.charAt(i);
        // add the fraction back in, if it was there
        if (typeof(y) != "undefined" && y.length > 0)
            x += decpoint + y;
    }
    return x;
}
