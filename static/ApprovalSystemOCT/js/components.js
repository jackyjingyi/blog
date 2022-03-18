function leftSideBarFunc(element, info, herf, active) {
    element.append(
        "<ul class='nav nav-third-level collapse in project-second-menu'>" +
        "<li class=" + active + ">" +
        "<a id='basicInfo' href=" + herf + ">" +
        "<span style='margin-left: 30%'>" + info + "</span></a></li>"
    )
}

function resignValue(ele, vl) {
    ele.find('input,textarea,select').each(function () {
            $(this).val(vl[$(this).attr("name")]);
        }
    )
    return vl
}

function assignValue(ele, vl) {
    console.log(ele, vl)
    ele.find('input,textarea,select').each(function () {
            if ($(this).attr("name") === 'project_start_time' || $(this).attr("name") === 'project_end_time') {
                vl[$(this).attr("name")] = $(this).val() + ":00.000000";
            } else {
                vl[$(this).attr("name")] = $(this).val();
            }
        }
    )
    return vl
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function csrfSafeMethod(method) {
    return (/^(GET|HEAD|OPTIONS|TRACE|PATCH|PUT)$/.test(method));
}