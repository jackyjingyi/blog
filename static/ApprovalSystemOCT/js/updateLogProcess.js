let setUpdateStep = function (processID, attachmentID) {
    $.ajax({
        url: '/projectSystem/updateAttachment/',
        data: {
            'process_id': processID,
            'attachment_id': attachmentID,
        },
        type: 'post',
        success: function (data) {
            return data
        }
    })
};

let getUpdateLog = function (processID, attachmentID) {
    return JSON.parse(JSON.parse($.ajax({
        url: "/projectSystem/getHistoryLog/",
        data: {
            'process_id': processID,
            'attachment_id': attachmentID,
        },
        type: 'post',
        async: false
    }).responseText).new_history);
}

let displayUpdateLog = function (data, table) {
    if (table === true) {
        let res = "<table class='table table-bordered table-striped'>" +
            "<thead>" +
            "<tr>" +
            "<th scope=\"col\"><small>序号</small></th>\n" +
            "<th scope=\"col\"><small>变更时间</small></th>\n" +
            "<th scope=\"col\"><small>变更人</small></th>\n" +
            "<th scope=\"col\"><small>变更字段</small></th>\n" +
            "<th scope=\"col\"><small>变更前</small></th>\n" +
            "<th scope=\"col\"><small>变更后</small></th>" +
            "</tr>" +
            "</thead>"
        for (let i = 0; i < data.length; i++) {
            let html = "<tr>"
            for (let j = 0; j < data[i].length; j++) {
                let _info = ""
                let _tik = ""
                if (data[i][j].length > 25) {
                    _tik = "……"
                }
                if (typeof data[i][j] == "string") {
                    _info = data[i][j].slice(0, Math.min(data[i][j].length, 25)) + _tik
                } else {
                    _info = data[i][j] + _tik
                }
                html += "<td>" + _info + "</td>"
            }
            html += "</tr>"
            res += html
        }
        res += "</table>"
        return res
    }
}