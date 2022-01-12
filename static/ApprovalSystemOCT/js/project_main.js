const csrftoken = getCookie('csrftoken');
const task_dict = {
    'type': {
        '1': '需求录入',
        '2': '管理员分发',
        '3': '线上修订',
        '4': '整理汇总',
        '5': '立项提交',
        '6': '领导审批'
    },
    'state': {
        '0': '任务进行中',
        '1': '成功',
        '2': '被删除',
        '3': '被合并',
        '4': '被驳回',
        '5': '技术失效,联系管理员',
        '6': '过期',
        '7': '审批通过',
        '8': '暂停'


    }

}
// query data defines query params
let queryData = {
    'setTime': '',
    'setStatus': '',
    'keyword': '',
    'user': '',
}

class User {
    constructor(id, username, is_authenticated) {
        this.id = id;
        this.username = username;
        this.is_authenticated = is_authenticated;
        this.is_admin = this.isAdmin();
    }

    get_object_permissions(obj) {
        // get user's permissions
        // obj -> str process id


    }

    action() {
        // do actions

    }

    isAdmin() {
        let ans = false
        $.ajax({
            // check user is in project SYS admin user group
            url: "/projectSystem/check-user-isadmin/",
            data: JSON.stringify({"user_id": this.id}),
            type: "post",
            async: false,
            contentType: 'application/json',
            success: function (data) {
                ans = data["is_admin"]
            }
        })
        return ans
    }


}

// build block
$("#breadcrumbRightSide").append(
    "<ol class='breadcrumb' id='title-right-side'>" +
    "<li class='backToMainButton'><a href='javascript:void(0)' data-target='0' data-action='topFilter'>所有课题</a></li>" +
    "<li class='backToMainButton'><a href='javascript:void(0)' data-target='1' data-action='topFilter'>我的课题</a></li>" +
    "</ol>"
)

// top right position , filter if projects are created by user themselves
$("a[data-action=topFilter]").on("click", function () {
    // 用户
    let ch = this
    $("a[data-action=topFilter]").each(function (idx, val) {

        if (val === ch) {
            $(this).css("background-color", "#337b8e");
            $(this).css("color", "#FFFFFF");
        } else {
            $(this).css("background-color", "");
            $(this).css("color", "#676A6C");
        }
    })
    // todo: add wait process,

    if ($(this).data("target") === 0) {
        // all projects,

        queryData["user"] = "";

        let url = genUrl()
        // 更新全局url
        get_process_list(url)
    } else if ($(this).data("target") === 1) { // if ($(this).data("target") === 1)
        queryData["user"] = "{{ user.pk }}";
        let user_is_authenticated = ("{{ user.is_authenticated }}".toLowerCase() === 'true');
        if (user_is_authenticated === true) {
            let url = genUrl()
            get_process_list(url)
        } else {
            window.location.href = "/members/login_to_app/"
        }
    }
})

$("a[data-action=setTime]").on("click", function () {
    const val = $(this).text()
    $("a[data-action=setTime]").each(function (idx, element) {
        $(element).css("background-color", "")
    })
    $(this).css("background-color", "#b6effb")
    $("#setTimeResult").text(val)
    queryData.setTime = $(this).attr("data-days");
})
$("#setTimeResult").on("click", function () {
    const val = $(this).text();

    $("a[data-action=setTime]").each(function () {
        if ($(this).text() === val) {
            $(this).css("background-color", "")
        }
    })
    $(this).text("");
    queryData.setTime = ""

})

$("a[data-action=setStatus]").on("click", function () {
    const val = $(this).text()
    $("a[data-action=setStatus]").each(function (idx, element) {
        $(element).css("background-color", "")
    });
    $(this).css("background-color", "#b6effb")
    $("#setStatusResult").text(val)
    queryData.setStatus = $(this).attr("data-id");

})
$("#setStatusResult").on("click", function () {
    const val = $(this).text();

    $("a[data-action=setStatus]").each(function () {
        if ($(this).text() === val) {
            $(this).css("background-color", "")
        }
    })
    queryData.setStatus = ""
    $(this).text("");

})
$("#keywordSearch").on("change", function () {
    const val = $(this).val()
    queryData.keyword = $(this).val();
    $("#keywordResult").text(val)

})
$("#keywordResult").on("click", function () {
    $("#keywordSearch").val("")
    $(this).text("");
    queryData.keyword = "";

})

function genUrl() {
    let url = "/projectSystem/processList/?format=json&process_pattern_id=1"

    if (queryData["setTime"] !== "") {
        let currentDate = new Date()
        let duration = parseInt(queryData["setTime"])
        if (duration > currentDate.getFullYear() - 10) {
            // 查询当年1月1日00：00：00到12月31日23：59：59之间的记录
            let endDate = new Date()
            currentDate.setFullYear(duration, 0, 1);
            currentDate.setHours(0, 0, 0)
            endDate.setFullYear(duration, 11, 31);
            endDate.setHours(23, 59, 59)
            url += "&create_time__gte=" + currentDate.format("yyyy-MM-dd hh:mm:ss")
                + "&create_time__lt=" + endDate.format("yyyy-MM-dd hh:mm:ss");
        } else {
            let q_date = addDays(currentDate, 0 - parseInt(queryData["setTime"]));
            url += "&create_time__gte=" + q_date.format("yyyy-MM-dd hh:mm:ss");
        }
    }
    if (queryData["setStatus"] !== "") {
        // status
        // all - 0 - null
        if (queryData["setStatus"] !== "0") {
            url += "&status=" + queryData["setStatus"];
        }
    }
    if (queryData["keyword"] !== "") {
        url += "&search_value=" + queryData["keyword"]
    }
    if (queryData["user"] !== "") {
        url += "&process_owner=" + queryData["user"]
    }
    sessionURL = url
    return url
}

$("button[data-action=search]").on("click", function () {
    // 搜索
    let url = genUrl();
    get_process_list(url)
})
$("button[data-action=refreshBtn]").on("click", function () {
    // 重置
    console.log("here reset")
    $("a[data-action=setTime]").each(function (idx, element) {
        $(element).css("background-color", "")
    });
    $("a[data-action=setStatus]").each(function (idx, element) {
        $(element).css("background-color", "")
    });
    $("#keywordSearch").val("");
    for (let val in queryData) {
        if (val !== "user") {
            queryData[val] = "";
        }

    }
    $(".badge").each(function () {
        $(this).text("")

    })
    get_process_list(genUrl())
});


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
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

Date.prototype.format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1,                 //月份
        "d+": this.getDate(),                    //日
        "h+": this.getHours(),                   //小时
        "m+": this.getMinutes(),                 //分
        "s+": this.getSeconds(),                 //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds()             //毫秒
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
}


// process objects
// receive, display, & functional events
class ProcessObject {

    constructor(obj) {
        this.process_order_id = obj.process_order_id;
        this.process_owner = obj.process_owner;
        this.project_name = obj.project_name
        this.process_status = obj.process_status;
        this.create_time = obj.create_time;
        this.target_detail = obj.target_detail;
        this.tasks = obj.tasks;
        this.actionlists = [];
        this.page = obj.page;
        this.process_leader = obj.process_leader;
    }


    static instance = new Set()

    static id_lists = new Set()

    static create(info) {

        let obj_data = {
            'process_order_id': info.process_order_id,
            'process_owner': info.process_owner,
            'create_time': info.create_time,
            // 已按step seq 、step seq 排序，
            'project_name': info.tasks[info.tasks.length - 1].steps[info.tasks[info.tasks.length - 1].steps.length - 1].step_attachment_snapshot[0].fields.project_name,
            'process_status': info.status,
            'target_detail': info.target_detail,
            'tasks': info.tasks,
            'page': info.page,
            'process_leader': info.process_leader,
        }

        if (this.check(obj_data)) {
            // not created
            let tmp = new ProcessObject(obj_data);
            this.id_lists.add(tmp.process_order_id)
            this.instance.add(tmp)
            return tmp;
        } else {
            let tmp = this.get_obj(obj_data.process_order_id)
            // update
            for (let key in obj_data) {

                if (tmp[key] !== obj_data[key]) {
                    tmp[key] = obj_data[key]
                }
            }
            return tmp
        }

    }

    get_current_state() {
        // return [ task_name, state, ]
        switch (this.tasks.length) {
            case 1:
                // input
                return ["input", this.tasks[0].task_state, this.tasks[0].task_type]
            case 2:
                // dispatch
                return ["dispatch", this.tasks[1].task_state, this.tasks[1].task_type]
            case 3:
                //
                return ["edit", this.tasks[2].task_state, this.tasks[2].task_type]
            case 4:
                return ["re-dispatch", this.tasks[3].task_state, this.tasks[3].task_type]
            case 5:
                return ["re-submit", this.tasks[4].task_state, this.tasks[4].task_type]
            case 6:
                return ["approval", this.tasks[5].task_state, this.tasks[5].task_type]
        }
    }

    static get_obj(pid) {

        for (const value of this.instance) {
            if (value.process_order_id === pid) {
                return value
            }
        }
    }


    static check(obj) {
        return !this.id_lists.has(obj.process_order_id);
    }

    display(user) {
        // user = sessionuser
        // exclude fail
        if (this.process_status !== '3') {
            let actList = this.actionList(user)
            console.log(actList)
            let current_info = this.get_current_state()
            let li = "<tr><td>" + this.project_name + "</td>" +
                "<td>" + task_dict.type[current_info[2]] + "</td>" +
                "<td>" + task_dict.state[current_info[1]] + "</td>" +
                "<td>" + this.process_owner.first_name + "</td>" +
                "<td><ul class='list-inline style='list-style: none'>" +
                "<li class='list-inline-item'><a href='/projectSystem/projectDetail/" + this.process_order_id + "' class='btn btn-sm btn-primary' data-action='view'  data-target='" + this.process_order_id + "'>查看</a></li>"
            for (let i of actList) {
                switch (i) {
                    case 'edit':
                        li += "<li class='list-inline-item'><a href='" + this.target_detail + "' class='btn btn-sm btn-primary' data-action='edit'  data-target='" + this.process_order_id + "'>编辑</a></li>"
                        break;
                    case 'submit':
                        li += "<li class='list-inline-item'><a class='btn btn-sm btn-primary' data-action='submit1' onclick='callAction(this)' data-target='" + this.process_order_id + "'>提交</a></li>"
                        break;
                    case 'delete':
                        li += "<li class='list-inline-item'><a class='btn btn-sm btn-primary' data-action='delete' onclick='callAction(this)' data-target='" + this.process_order_id + "'>删除</a></li>"
                        break;
                    case 'dispatch':
                        li += "<li class='list-inline-item'><a class='btn btn-sm btn-primary' data-action='dispatch' onclick='callAction(this)' data-target='" + this.process_order_id + "'>分发</a></li>"
                        break;
                    case 'pack-up':
                        li += "<li class='list-inline-item'><a class='btn btn-sm btn-primary' data-action='pack-up' onclick='callAction(this)' data-target='" + this.process_order_id + "'>合并</a></li>"
                        break;
                    case 're-dispatch':
                        li += "<li class='list-inline-item'><a class='btn btn-sm btn-primary' data-action='re-dispatch' onclick='callAction(this)' data-target='" + this.process_order_id + "'>指派</a></li>"
                        break;
                    case 're-submit':
                        li += "<li class='list-inline-item'><a class='btn btn-sm btn-primary' data-action='re-submit' onclick='callAction(this)' data-target='" + this.process_order_id + "'>提交立项</a></li>"
                        break;
                    case 'submit2':
                        li += "<li class='list-inline-item'><a class='btn btn-sm btn-primary' data-action='submit2' onclick='callAction(this)' data-target='" + this.process_order_id + "'>提交</a></li>"
                        break;
                }
            }

            li += "</ul></td></tr>";
            return li
        }
        return ""
    }

    liable(user, action) {
        switch (action) {
            case 'delete':
                // todo: check if deletion rule with task procedure and time interval
                return user.id == this.process_owner.id || user.is_admin
        }

    }

    no_rights_display_layer(action) {
        return layer.ready(
            layer.open({
                type: 1,
                area: ['780px', '500px'],
                shadeClose: true, //点击遮罩关闭
                title: '课题提交确认',
                content: "<p style='margin: 30px;margin-bottom:-15px'>暂无" + action + "《" + this.project_name + "》的权限</p>",
                btn: ['确认', '取消'],
                yes: function (index, layro) {
                    layer.close(index)
                }
            })
        );
    }


    delete(user) {
        let process_id = this.process_order_id;
        let project_name = this.project_name;

        if (this.liable(user, 'delete')) {

            layer.ready(
                layer.open({
                    type: 1,
                    area: ['780px', '500px'],
                    shadeClose: true, //点击遮罩关闭
                    title: '需求删除确认',
                    content: "<div><div class='row' style='margin: 0'>" +
                        "<p style='margin-left: 30px'>是否删除《" + project_name + "》？</p>" +
                        "</div>" +
                        "<div class='row' style='margin-left: 30px;margin-top:30px;margin-right: 30px'><div class='col-md-6'>" +
                        "<textarea name='comments' rows=12 cols=110 type='text' id='commentsid' placeholder='请输入备注'></textarea>" +
                        "</div></div></div>",
                    btn: ['确认', '取消'],
                    yes: function (index, layro) {
                        let content = $(layro).find(".layui-layer-content").find("textarea").val()
                        console.log(content)
                        $.ajax({
                            url: "/projectSystem/process-deletion/",
                            data: {
                                'process_id': process_id,
                                'comments': content,
                            },
                            type: "post",
                            headers: {'X-CSRFToken': csrftoken},
                            success: function (data) {
                                $(layro).find(".layui-layer-content").empty();
                                $(layro).find(".layui-layer-content").append(
                                    "<p>提交成功！</p>"
                                )
                            }
                        })
                        setTimeout(function () {
                            layer.close(index)
                            location.reload();
                        }, 1500);
                    }
                })
            );

        } else {
            this.no_rights_display_layer('删除');
        }
    }

    firstSubmit(user, ty) {
        // input task submit
        let process_id = this.process_order_id;
        let project_name = this.project_name;

        if (this.process_owner.id == user.id) {
            layer.ready(
                layer.open({
                    type: 1,
                    area: ['780px', '500px'],
                    shadeClose: true, //点击遮罩关闭
                    title: '课题提交确认',
                    content: "<div><div class='row' style='margin: 0'>" +
                        "<p style='margin-left: 30px'>是否提交《" + project_name + "》？</p>" +
                        "</div>" +
                        "<div class='row' style='margin-left: 30px;margin-top:30px;margin-right: 30px'><div class='col-md-6'>" +
                        "<textarea name='comments' rows=12 cols=110 type='text' id='commentsid' placeholder='请输入提交记录'></textarea>" +
                        "</div></div></div>",
                    btn: ['确认', '取消'],
                    yes: function (index, layro) {
                        let content = $(layro).find(".layui-layer-content").find("textarea").val()
                        console.log(content)
                        $.ajax({
                            url: "/projectSystem/first-submission/",
                            data: {
                                'process_id': process_id,
                                'comments': content,
                                'task_type': ty,
                            },
                            type: "post",
                            headers: {'X-CSRFToken': csrftoken},
                            success: function (data) {
                                $(layro).find(".layui-layer-content").empty();
                                $(layro).find(".layui-layer-content").append(
                                    "<p>提交成功！</p>"
                                )
                            }
                        })
                        setTimeout(function () {
                            layer.close(index)
                            location.reload();
                        }, 1500);
                    }
                })
            );


        } else {
            this.no_rights_display_layer('提交');
        }
    }


    dispatch(user, task_type) {
        let process_id = this.process_order_id
        let project_name = this.project_name
        if (user.is_admin) {
            // current login user has the authority to dispatch project
            // 1. call layer
            $.ajax({
                url: "/projectSystem/projectDispatch/",
                type: "get",
                data: {
                    "annuual": false,
                },
                success: function (data) {
                    layer.ready(
                        layer.open({
                            type: 1,
                            area: ['780px', '500px'],
                            shadeClose: true, //点击遮罩关闭
                            title: '课题分发确认',
                            content: "<p style='margin: 30px;margin-bottom:-15px'>请分配" + "&nbsp" + "<strong>" + project_name + "</strong>" + "</p>" + data.html,
                            btn: ['确认', '取消'],
                            yes: function (index, layro) {
                                let x = $("#set_assignee").serializeArray().reduce(function (obj, item) {
                                    obj[item.name] = item.value;
                                    console.log(item.name, item.value)
                                    return obj;
                                }, {})
                                console.log(x)
                                $.ajax({
                                    url: '/projectSystem/processDispatch/',
                                    data: {
                                        "process_id": process_id,
                                        "process_owner": x.project_sponsor,
                                        "process_leader": x.project_head_master,
                                        "task_type": task_type,
                                    },
                                    headers: {'X-CSRFToken': csrftoken},
                                    type: "post",
                                    success: function (data) {
                                        $($(layro[0]).children()[1]).empty();
                                        $($(layro[0]).children()[1]).append("<p style='margin: 30px;margin-bottom:-15px'>" + project_name + "<strong>分配成功</strong>" + "</p>"
                                        );
                                        setTimeout(function () {
                                            layer.close(index);
                                        }, 2000);
                                        location.reload();
                                    }
                                })

                            }
                        })
                    );
                }

            })

        } else {
            this.no_rights_display_layer('分发');
        }
    }

    re_submit(user) {
        // user should be owner
        let process_id = this.process_order_id;
        let project_name = this.project_name;
        let process_owner = this.process_owner;
        let leader = this.process_leader
        console.log(leader)
        let tik = 1
        if (user.id == this.process_owner.id) {
            $.ajax({
                url: "/projectSystem/projectDispatch/",
                type: "get",
                data: {"annuual": true},
                success: function (data) {
                    layer.ready(
                        layer.open({
                            type: 1,
                            area: ['780px', '500px'],
                            shadeClose: true, //点击遮罩关闭
                            title: '课题分发确认',
                            content: "<p style='margin: 30px;margin-bottom:-15px'>请分配" + "&nbsp" + "<strong>" + project_name + "</strong>" + "</p>" + data.html,
                            btn: ['确认', '取消'],
                            yes: function (index, layro) {
                                let x = $("#set_assignee").serializeArray().reduce(function (obj, item) {
                                    obj[item.name] = item.value;
                                    console.log(item.name, item.value)
                                    return obj;
                                }, {})
                                x["process_id"] = process_id
                                x["project_sponsor"] = $("#project_sponsor").val()
                                x["project_head_master"] = $("#project_head_master").val()
                                console.log(x)
                                $.ajax({
                                    url: "/projectSystem/re-submit/",
                                    type: "post",
                                    headers: {'X-CSRFToken': csrftoken},
                                    data: x,
                                    success: function (data) {

                                        $($(layro[0]).children()[1]).empty();
                                        $($(layro[0]).children()[1]).append("<p style='margin: 30px;margin-bottom:-15px'>" + project_name + "<strong>提交成功</strong>" + "</p>"
                                        );
                                        setTimeout(function () {
                                            layer.close(index);
                                        }, 2000);
                                        location.reload();
                                    }
                                })

                            }
                        })
                    );

                    function init_owner() {
                        let project_sponsor = $("#project_sponsor");
                        let project_leader = $("#project_head_master");
                        $("select[name=project_sponsor] option[value=" + process_owner.id + "]").attr("selected", "selected");
                        $("select[name=project_head_master] option[value=" + leader + "]").attr("selected", "selected");
                        console.log(project_leader.val())
                        project_sponsor.attr("disabled", "disabled");
                        project_leader.attr("disabled", "disabled");
                    }

                    init_owner();
                    $("#add_one").on("click", function () {
                        // add one row for outsourcing information
                        let current_company = "project_outsourcing_companies_" + tik.toString()
                        let current_company_info = "project_outsourcing_info_" + tik.toString()
                        $(this).parent().parent().before(
                            "<div class='row margin-top-5'>" +
                            "<div class='col-md-6'>" +
                            "<label for='" + current_company + "'" + ">外部合作单位</label>" +
                            "<input class='form-control' name='" + current_company + "'" + "id='" + current_company + "'" + "/>" +
                            "</div>" +
                            "<div class='col-md-6'>" +
                            "<label for='" + current_company_info + "'" + ">外部合作内容</label>" +
                            "<input class='form-control' name='" + current_company_info + "'" + "id='" + current_company_info + "'" + "/>" +
                            "</div>" +
                            "</div>"
                        )
                        tik += 1
                    })
                    console.log(tik)
                }
            })

        } else {
            this.no_rights_display_layer("立项")
        }
    }

    actionList(user) {
        let ans = this.selfActions(user)
        // check if submitted
        if (user.is_admin) {
            // admin user
            console.log("admin user")
            switch (this.tasks.length) {
                // task0 : input
                case 1:
                    // 后端保证只返回 1 、3 状态的
                    if (this.tasks[0].task_state == '1') {
                        ans.push('dispatch', 'edit', 'delete')   // todo: pack-up delete
                    }
                    // task1 : dispatch
                    break;
                case 2:
                    // 分发阶段，非管理员自身无
                    ans.push('dispatch', 'edit', 'delete')   // todo: pack-up delete
                    break;
                // task2 : edit
                case 3:
                    if (this.tasks[2].task_state == '0') {
                        // 未提交
                        ans.push('edit', 'delete')
                    } else {
                        //
                        ans.push('edit', 'delete', 'pack-up', 're-dispatch')
                    }
                    break;
                // re-dispatch
                case 4:
                    ans.push('edit', 'delete', 'pack-up', 're-dispatch')
                    break;
                // task4 : final submit
                case 5:
                    ans.push('edit')
                    break;
                case 6:
                    break
            }

        }
        return ans
    }


    selfActions(user) {
        if (user.id == this.process_owner.id) {

            switch (this.tasks.length) {
                // task0 : input
                case 1:
                    // 后端保证只返回 1 、3 状态的
                    if (this.tasks[0].task_state == '0') {
                        // 未提交
                        return ['edit', 'submit', 'delete']
                    } else {
                        // 已提交,等待管理员分发；不可编辑
                        return []
                    }
                // task1 : dispatch
                case 2:
                    // 分发阶段，非管理员自身无
                    return []
                // task2 : edit
                case 3:
                    if (this.tasks[2].task_state == '0') {
                        // 未提交
                        return ['edit', 'submit2']
                    } else {
                        // 已提交,等待管理员重新分发；不可编辑
                        return []
                    }
                // re-dispatch
                case 4:
                    return []
                // task4 : final submit
                case 5:
                    if (this.tasks[4].task_state == '0') {
                        // 未提交
                        return ['edit', 're-submit',]
                    } else {
                        // 已提交,等待管理员重新分发；不可编辑
                        return []
                    }
                case 6:
                    if (this.tasks[5].task_state == '8') {
                        // deny
                        return ['edit', 're-submit',]
                    } else {
                        return []
                    }
            }
        } else {
            return []
        }
    }


}

function get_process_list(link) {
    // 向后端请求数据并创建相关obj
    let displayPanel = $("tbody[class=displayProcessObj]").first()
    let total_pages = ""
    $.ajax({
        url: link,
        type: "get",
        success: function (data) {
            console.log(data)
            total_pages = data.total_pages;
            // page item number
            if (data.results.length > 0) {

                displayPanel.empty();
                for (let k of data.results) {
                    // add page number
                    k['page'] = data.current;
                    if ((sessionUser.is_authenticated === "True" && k.process_owner.id == sessionUser.id) || (sessionUser.is_admin)) {

                        let p = ProcessObject.create(k);
                        console.log(p)
                        $("tbody[class=displayProcessObj]").first().append(p.display(sessionUser))
                    } else {
                        if (!queryData.user == "") {

                            if (k.tasks[0].task_state === '1' && queryData.user == k.process_owner.id) {
                                // only display first task success process
                                let p = ProcessObject.create(k);
                                $("tbody[class=displayProcessObj]").first().append(p.display(sessionUser))
                            }
                        } else {

                            if (k.tasks[0].task_state === '1') {
                                // only display first task success process
                                let p = ProcessObject.create(k);
                                $("tbody[class=displayProcessObj]").first().append(p.display(sessionUser))
                            }
                        }

                    }
                }
            } else {
                displayPanel.empty();
            }
            // todo need consider the page issue
            let psize = 0
            for (let p of ProcessObject.instance) {
                if (p.process_status !== '3') {
                    psize += 1;
                }
            }

            $("#totalBySearch").text(psize)
            // page init

            initPageLine(parseInt(total_pages));
            // assign page link
            $("#current_page_id").text("当前第" + data.current + "页")
            $("a[data-action=page-number]").on("click", function () {
                let page_number = $(this).data("target");
                get_process_list(sessionURL + "&page=" + page_number.toString())

            })

            if (data.links.previous) {
                $("a[data-action=page-previous]").on("click", function () {
                    get_process_list(data.links.previous)
                })
            } else {
                $("a[data-action=page-previous]").parent().addClass("disabled")
            }
            if (data.links.next) {
                $("a[data-action=page-next]").on("click", function () {
                    get_process_list(data.links.next)
                })
            } else {
                $("a[data-action=page-next]").parent().addClass("disabled")
            }

        },
        error: function (errors) {
            console.log(errors)
        }

    })
}

function initPageLine(pages, panel = null) {
    // poges : int
    let all_page_links = "<li class='page-item'><a class='page-link' href='javascript:void(0)' aria-label='Previous' data-action='page-previous'><span aria-hidden='true'>&laquo;</span><span class='sr-only'>Previous</span></a></li>"
    for (let i = 1; i <= pages; i++) {
        // if success, at least one page
        all_page_links += "<li class='page-item'><a class='page-link' href='javascript:void(0)' data-action='page-number' data-target='" + i + "'>" + i + "</a></li>"
    }
    all_page_links += "<li class='page-item'><a class='page-link' href='javascript:void(0)' aria-label='Next' data-action='page-next'><span aria-hidden='true'>&raquo;</span><span class='sr-only'>Next</span></a></li>";
    if (panel === null) {
        let page_base = $("#pagination-base")
        page_base.empty();
        page_base.append(
            all_page_links
        )
    } else {
        panel.empty();
        panel.append(
            all_page_links
        )
    }
}

function callAction(e) {
    let id = $(e).data('target')
    let action = $(e).data('action')
    let process = ProcessObject.get_obj(id)
    console.log("here")
    switch (action) {
        case 'submit1':
            process.firstSubmit(sessionUser, "input");
            break;
        case 'dispatch':
            process.dispatch(sessionUser, 2);
            break;
        case 'delete':
            process.delete(sessionUser);
            break;
        case 'pack-up':
            pack_up_global(sessionUser);
            break;
        case 're-dispatch':
            process.dispatch(sessionUser, 4);
            break;
        case 're-submit':
            process.re_submit(sessionUser);
            break;
        case 'submit2':
            process.firstSubmit(sessionUser, "edit");
            break;
    }
    console.log("process finish ")
}


function pack_up_global(user) {
    if (user.is_admin) {
        // first open layer
        // content is a table
        let conjunction_list = []
        let content_init = pack_up_init_values()
        layer.ready(
            layer.open({
                type: 1,
                area: ['780px', '500px'],
                shadeClose: true, //点击遮罩关闭
                title: '课题分发确认',
                content: content_init,
                btn: ['确认', '取消'],
                yes: function (index, layro) {
                    $(".pack-up-item").each(function (idx, element) {
                        console.log($(element).prop("checked"))
                        if ($(element).prop("checked")) {
                            if (!conjunction_list.includes($(element).attr("value"))) {
                                conjunction_list.push($(element).attr("value"))
                            }
                        } else {
                            if (conjunction_list.includes($(element).attr("value"))) {
                                conjunction_list.pop($(element).attr("value"))
                            }
                        }

                    })
                    if (conjunction_list.length < 2) {
                        $($(layro[0]).children()[1]).empty();
                        $($(layro[0]).children()[1]).append(
                            "<p>请至少选择2个项目</p>"
                        );
                        setTimeout(function () {
                            $($(layro[0]).children()[1]).empty();
                            $($(layro[0]).children()[1]).append(content_init);
                        }, 1500);
                    } else {
                        $.ajax({
                            url: "/projectSystem/processPackUp/",
                            data: {'data': JSON.stringify(conjunction_list)},
                            type: 'post',
                            success: function (data) {
                                layer.close(index)
                                window.location.href = data.url

                            }
                        })
                    }
                    // conjunctionlist send to back end

                }
            })
        );
    }
}

function pack_up_init_values(page = null) {
    let link = "/projectSystem/processListPackUP/?format=json"
    if (page) {
        link += "&page=" + page
    }

    let _content = "<div class='table table-bordered'><table class='table table-bordered table-striped'><thead><tr>" +
        "<th></th>" +
        "<th>需求名称</th>" +
        "<th>负责人</th>" +
        "</tr></thead><tbody>"

    $.ajax({
        url: link,
        type: "get",
        async: false,
        success: function (data) {
            for (let k of data) {
                if (k.process_status !== '3') {
                    _content += "<tr>" +
                        "<td><input class='pack-up-item' name='pack-up-id' value='" + k.process_order_id + "' type='checkbox'></td>" +
                        "<td>" + k.tasks[k.tasks.length - 1].steps[k.tasks[k.tasks.length - 1].steps.length - 1].step_attachment_snapshot[0].fields.project_name + "</td>" +
                        "<td>" + k.process_owner.first_name + "</td>" +
                        "</tr>"
                }

            }
            _content += "</tbody></table></div>"

        }
    })
    return _content
}

function get_group_leader_todo(user) {
    let check_dict = {
        'status': {
            '1': '成功',
            '2': '进行中',
        },
        'state': {
            '1': '完成',
        },
        'type': {
            '1': '创建',
            '2': '编辑',
            '3': '提交',
            '4': '审批通过',
            '5': '删除',
            '6': '撤回',
            '7': '驳回',
            '8': '分发',  //占位
            '9': '合并',
            '10': '分发/指派',
            '11': '提交立项',
            '12': '占位',
        }
    }
    if (user.is_authenticated) {
        $.ajax({
            url: "/projectSystem/check_information_for_group_leader/",
            type: "get",
            success: function (data) {
                console.log(data)
                let content_init = "<div class='table table-bordered'><table class='table table-bordered table-striped'><thead><tr>" +
                    "<th scope='col'>课题名称</th>" +
                    "<th scope='col'>状态</th>" +
                    "<th scope='col'>提交日期</th>" +
                    "<th scope='col'>备注</th>" +
                    "</tr></thead><tbody>"
                for (let item of data.steps) {
                    // step.fields
                    let step_type = check_dict.type[item.fields.step_type];
                    let step_create_time = item.fields.step_create_time.slice(0, 10);
                    let comments = item.fields.comments;
                    let project_name = item.fields.step_attachment_snapshot[0].fields.project_name;
                    content_init += "<tr><td>" + project_name + "</td>" +
                        "<td>" + step_type + "</td>" +
                        "<td>" + step_create_time + "</td>" +
                        "<td>" + comments + "</td></tr>"
                }
                content_init += "</tbody></table></div>"
                layer.ready(
                    layer.open({
                        type: 1,
                        area: ['780px', '500px'],
                        shadeClose: true, //点击遮罩关闭
                        title: '代办事项',
                        content: content_init,
                        btn: ['确认', '取消'],
                        yes: function (index, layro) {
                            layer.close(index)

                        }
                    })
                )

            },
            error: function (error_data) {
                console.log(error_data)
            }
        })
    }
}

//get_group_leader_todo(sessionUser)

function get_user_todo(user) {
    if (user.is_authenticated) {

        $.ajax({
            url: "/projectSystem/task_info/get-leader-todos/",
            type: "get",
            success: function (data) {

                if (data.length > 0) {
                    let content_init = "<div class='table table-bordered'><table class='table table-bordered table-striped'><thead><tr>" +
                        "<th scope='col'>课题名称</th>" +
                        "<th scope='col'>提交人</th>" +
                        "<th scope='col'>提交日期</th>" +
                        "<th scope='col'>状态</th>" +
                        "</tr></thead><tbody>"
                    for (let t of data) {
                        let name = ""
                        // todo name
                        $.ajax({
                            url: "/projectSystem/processList/?format=json&process_order_id=" + t.process,
                            type: "get",
                            async: false,
                            success: function (pd) {

                                name = pd.results[0].process_owner.first_name;
                            }
                        })
                        content_init += "<tr>" +
                            "<td><a href='/projectSystem/project_leader_dashboard/'>" + t.steps[t.steps.length - 1].step_attachment_snapshot[0].fields.project_name + "</a></td>" +
                            "<td>" + name + "</td>" +
                            "<td>" + t.task_creat_time.slice(0, 10) + "</td>" +
                            "<td>待审批</td></tr>"
                    }
                    content_init += "</tbody></table></div>"

                    layer.ready(
                        layer.open({
                            type: 1,
                            area: ['780px', '500px'],
                            shadeClose: true, //点击遮罩关闭
                            title: '代办事项',
                            content: content_init,
                            btn: ['确认', '取消'],
                            yes: function (index, layro) {
                                layer.close(index)

                            }
                        })
                    )
                }
            }
        })


    }
}

// get_user_todo(sessionUser);
//
// get_process_list(genUrl())
