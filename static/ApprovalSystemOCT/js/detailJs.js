$("a[data-action='upload']").attr("hidden", true);
$("#updateAll").attr("hidden", true);

// initial user and process

// user must a registered user


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
                return ["input", this.tasks[0].task_state]
            case 2:
                // dispatch
                return ["dispatch", this.tasks[1].task_state]
            case 3:
                //
                return ["edit", this.tasks[2].task_state]
            case 4:
                return ["re-dispatch", this.tasks[3].task_state]
            case 5:
                return ["re-submit", this.tasks[4].task_state]
            case 6:
                return ["approval", this.tasks[5].task_state]
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
            let li = ""
            for (let i of actList) {
                switch (i) {
                    case 'edit':
                        $("a[data-action='upload']").on('click', function () {
                            // use siblings not next ,cause a div tag will insert in
                            let inputTag = $(this).parent().parent().find("input,textarea,select");
                            let prepVal = inputTag.val()

                            // if disabled === true
                            if (inputTag.attr('disabled')) {
                                let t = $(this).attr("data-target")

                                inputTag.attr('disabled', false);
                                if (inputTag.hasClass("selectpicker")) {
                                    inputTag.selectpicker('refresh')
                                }
                                if ($(this).parent().parent().find("a[data-action~='upload']").length <= 1) {
                                    $(this).parent().after(
                                        "<div class='pull-right'>" +
                                        "<a class='text-right' data-action='uploadSubmit' data-target=" + t + " href='javascript:void(0)' style='visibility: visible;'><small> 修改 </small></a>" +
                                        "<a class='text-right' data-action='uploadCancel' data-target=" + t + " href='javascript:void(0)' style='visibility: visible;'><small> 取消 </small></a>" +
                                        "</div>"
                                    );
                                } else {
                                    $(this).parent().next().find('a').each(function () {
                                        $(this).attr('style', 'visibility: visible');
                                    })
                                }
                                $("a[data-action=uploadSubmit]").on('click', function () {
                                    {

                                        inputTag = $(this).parent().siblings().last();

                                    }
                                    let attachmentRequirementKey = inputTag.attr("name");
                                    let attachmentRequirementVal = inputTag.val();
                                    if (prepVal !== attachmentRequirementVal) {
                                        let data = {};
                                        data[attachmentRequirementKey] = attachmentRequirementVal
                                        // patch method
                                        $.ajax({
                                            url: attachURL,
                                            type: 'patch',
                                            contentType: 'application/json',
                                            data: JSON.stringify(data),
                                            headers: {'X-CSRFToken': csrftoken},
                                            success: function (new_data) {
                                                inputTag.val(data[attachmentRequirementKey]);
                                                setUpdateStep(processID, attachmentUUID);
                                            }
                                        })
                                    }

                                    inputTag.attr('disabled', true);
                                    if (inputTag.hasClass("selectpicker")) {
                                        inputTag.selectpicker('refresh')
                                    }
                                    $(this).attr('style', 'visibility: hidden');
                                    $(this).next().attr('style', 'visibility: hidden');
                                });
                                $("a[data-action=uploadCancel]").on('click', function () {
                                    inputTag.val(prepVal);
                                    inputTag.attr('disabled', true);
                                    if (inputTag.hasClass("selectpicker")) {
                                        inputTag.selectpicker('refresh')
                                    }
                                    $(this).attr('style', 'visibility: hidden');
                                    $(this).prev().attr('style', 'visibility: hidden');
                                });
                            }
                        });
                        $("#updateAll").attr("hidden", false);
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
            console.log("has rights")
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

// init process

// this page
const url = "/projectSystem/processList/?format=json&process_order_id=" + process_id

// todo
function get_process_list(link) {
    // 向后端请求数据并创建相关obj
    let displayPanel = $("#controlPanel")
    $.ajax({
        url: link,
        type: "get",
        success: function (data) {
            console.log(link)
            console.log(data)
            if (data.results.length > 0) {
                // only display moves
                displayPanel.empty();
                for (let k of data.results) {
                    // user must login
                    if (sessionUser.is_authenticated === "True") {
                        // three type of users
                        let p = ProcessObject.create(k)
                        displayPanel.append(p.display(sessionUser));
                        // 1. process owner

                        // 2. admin user

                        // 3. process leader

                        // 4. other user （backend should not let him visit this page)

                    } else {
                        // redict to login page
                    }
                }
            } else {
                displayPanel.empty();
            }
            // todo need consider the page issue
        },
        error: function (errors) {
            console.log(errors)
        }
    })
}

get_process_list(url);


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
const csrftoken = getCookie('csrftoken');
// todo: if currentTaskTypeID is approval => assign to re-sub part | not critical yet

let updateForm = $("#update_project");
let formStatusChange = function (form, action) {
    form.find('input,textarea,select').each(function () {
        if ($(this).attr("disabled") !== action) {
            $(this).attr("disabled", action);
            if ($(this).hasClass("selectpicker")) {
                $(this).selectpicker("refresh");
            }
        }
    });
};
let setUpdateStep = function (processID, attachmentID) {
    $.ajax({
        url: '/projectSystem/updateAttachment/',
        data: {
            'process_id': processID,
            'attachment_id': attachmentID,
            'task_type': currentTaskTypeID,
        },
        type: 'post',
        success: function (data) {
            updateLog(data.new_history);
        }
    })
};
let updateLog = function (data) {
    let clt = $("#changeLogTbody")
    clt.empty();
    let html = "<tr>"
    for (let i = 0; i < data.length; i++) {
        let html = "<tr><td>" + (i + 1).toString() + "</td>"
        for (let j = 1; j < data[i].length; j++) {
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
            if (j === 4) {
                html += "<td style='text-decoration: line-through' class='text-danger'>" + _info + "</td>"
            } else {
                html += "<td>" + _info + "</td>"
            }
        }
        html += "</tr>"
        clt.append(html)
    }
}
$('#wordTransformDetail').on('click', function () {
    let docxurl = ''

    function download2(fp) {
        var $form = $('<form method="GET"></form>');
        $form.attr('action', fp);
        $form.appendTo($('body'));
        $form.submit();
    }

    $.ajax({
        url: '/projectSystem/transform/ProjectRequirement/',
        type: 'post',
        async: false,
        data: {'requirement_id': attachmentTargetID},
        success: function (data) {
            docxurl = data['docx']
            download2(docxurl)
        }
    })
})
$('label').each(function () {
    let updateTarget = $(this).attr('for')
    $(this).append(
        "<a data-action='upload' data-target=" + updateTarget + " href='javascript:void(0)' style='visibility: hidden;'><i class='pull-right icon iconfont icon-bianji'></i></a>"
    );
    $(this).hover(function () {
        $(this).children('a').attr('style', 'visibility: visible');
    });
    $(this).parent().mouseleave(function () {
        $(this).find('a').first().attr('style', 'visibility: hidden');
    });
});
// {#$("a[data-action='upload']").on('click', function () {#}
// {#    // use siblings not next ,cause a div tag will insert in#}
// {#    let inputTag = $(this).parent().parent().find("input,textarea,select");#}
// {#    let prepVal = inputTag.val()#}
// {##}
// {#    // if disabled === true#}
// {#    if (inputTag.attr('disabled')) {#}
// {#        let t = $(this).attr("data-target")#}
// {##}
// {#        inputTag.attr('disabled', false);#}
// {#        if (inputTag.hasClass("selectpicker")) {#}
// {#            inputTag.selectpicker('refresh')#}
// {#        }#}
// {#        if ($(this).parent().parent().find("a[data-action~='upload']").length <= 1) {#}
// {#            $(this).parent().after(#}
// {#                "<div class='pull-right'>" +#}
// {#                "<a class='text-right' data-action='uploadSubmit' data-target=" + t + " href='javascript:void(0)' style='visibility: visible;'><small> 修改 </small></a>" +#}
// {#                "<a class='text-right' data-action='uploadCancel' data-target=" + t + " href='javascript:void(0)' style='visibility: visible;'><small> 取消 </small></a>" +#}
// {#                "</div>"#}
// {#            );#}
// {#        } else {#}
// {#            $(this).parent().next().find('a').each(function () {#}
// {#                $(this).attr('style', 'visibility: visible');#}
// {#            })#}
// {#        }#}
// {#        $("a[data-action=uploadSubmit]").on('click', function () {#}
// {#let inputTag = $(this).parent().siblings().last();#}
// {#            let attachmentRequirementKey = inputTag.attr("name");#}
// {#            let attachmentRequirementVal = inputTag.val();#}
// {#            if (prepVal !== attachmentRequirementVal) {#}
// {#                let data = {};#}
// {#                data[attachmentRequirementKey] = attachmentRequirementVal#}
// {#                // patch method#}
// {#                $.ajax({#}
// {#                    url: attachURL,#}
// {#                    type: 'patch',#}
// {#                    contentType: 'application/json',#}
// {#                    data: JSON.stringify(data),#}
// {#                    headers: {'X-CSRFToken': csrftoken},#}
// {#                    success: function (new_data) {#}
// {#                        inputTag.val(data[attachmentRequirementKey]);#}
// {#                        setUpdateStep(processID, attachmentUUID);#}
// {#                    }#}
// {#                })#}
// {#            }#}
// {##}
// {#            inputTag.attr('disabled', true);#}
// {#            if (inputTag.hasClass("selectpicker")) {#}
// {#                inputTag.selectpicker('refresh')#}
// {#            }#}
// {#            $(this).attr('style', 'visibility: hidden');#}
// {#            $(this).next().attr('style', 'visibility: hidden');#}
// {#        });#}
// {#        $("a[data-action=uploadCancel]").on('click', function () {#}
// {#            inputTag.val(prepVal);#}
// {#            inputTag.attr('disabled', true);#}
// {#            if (inputTag.hasClass("selectpicker")) {#}
// {#                inputTag.selectpicker('refresh')#}
// {#            }#}
// {#            $(this).attr('style', 'visibility: hidden');#}
// {#            $(this).prev().attr('style', 'visibility: hidden');#}
// {#        });#}
// {#    }#}
// {# });#}

let resignValue = function (ele, vl) {
    ele.find('input,textarea,select').each(function () {
            $(this).val(vl[$(this).attr("name")]);
        }
    )
}
$("#updateAll").on('click', function () {
    let prevValue = {};
    let assignValue = function (ele, vl) {
        ele.find('input,textarea,select').each(function () {
                if ($(this).attr("name") === 'project_start_time' || $(this).attr("name") === 'project_end_time') {
                    vl[$(this).attr("name")] = $(this).val() + ":00.000000";
                } else {
                    vl[$(this).attr("name")] = $(this).val();
                }
            }
        )
    }

    assignValue(updateForm, prevValue)

    if ($(this).parent().find('a').length <= 1) {
        $(this).after(
            "&nbsp;<a id='updateAllSubmit'>提交</a>" +
            "&nbsp;<a id='updateCancelAll'>取消</a>"
        );
    } else {
        $(this).parent().find('a').each(function () {
            $(this).show();
        })
    }
    $(this).hide();
    formStatusChange(updateForm, false);

    $("#updateAllSubmit").on("click", function () {
        let currentValues = {}
        assignValue(updateForm, currentValues);
        console.log(currentValues)
        $.ajax({
            url: attachURL,
            type: 'patch',
            contentType: 'application/json',
            data: JSON.stringify(currentValues),
            headers: {'X-CSRFToken': csrftoken},
            success: function (data) {
                resignValue(updateForm, data);
                setUpdateStep(processID, attachmentUUID);
            },
            error: function (data) {
                console.log(data)
            }
        })
        formStatusChange(updateForm, true);
        $(this).hide();
        $(this).prev().show();
        $(this).next().hide();

    });
    $("#updateCancelAll").on('click', function () {
        formStatusChange(updateForm, true);
        updateForm.find('input,textarea,select').each(function () {
            $(this).val(prevValue[$(this).attr("name")]);
        });
        $(this).hide();
        $(this).prev().hide();
        $(this).prev().prev().show();

    })
})
$('#project_start_time').datetimepicker({
    format: 'Y-m-d H:i',
    onShow: function (ct) {
        this.setOptions({
            maxDate: $('#project_end_time').val() ? $('#project_end_time').val() : false
        })
    },

});
$('#project_end_time').datetimepicker({
    format: 'Y-m-d H:i',
    onShow: function (ct) {
        this.setOptions({
            minDate: $('#project_start_time').val() ? $('#project_start_time').val() : false
        })
    },

});
$('#secondaryMenu').append(
    "<li class='fa fa-angle-right'>" + "课题需求" + "</li>" + "<li class='fa fa-angle-right active fw-bold'>" + "{{ template_name }}" + "</li>"
);

$.each($(".liGroupList"), function (idx, opt) {
    let urlPath = "{{ template_name }}"
    if (opt.innerText === urlPath) {
        $(opt).addClass('active');
    } else {
        $(opt).removeClass('active');
    }
});

$("#my_projects").append(
    "<ul class='nav nav-third-level collapse in project-second-menu'>" +
    "<li class='active'>" +
    "<a id='basicInfo' href=''>" +
    "<span style='margin-left: 30%'>课题信息</span></a></li>"
);
let displayRequirement = function (c, v) {
    layer.ready(
        layer.open({
            type: 1,
            area: ['780px', '500px'],
            shadeClose: true, //点击遮罩关闭
            title: '选择初始值',
            content: c,
            btn: ['确认', '取消'],
            yes: function (index, layro) {
                $.ajax({
                    url: attachURL,
                    type: 'patch',
                    contentType: 'application/json',
                    data: JSON.stringify(v),
                    headers: {'X-CSRFToken': csrftoken},
                    success: function (data) {
                        resignValue(updateForm, data)
                        formStatusChange(updateForm, true);
                        setUpdateStep(processID, attachmentUUID);
                    },
                    error: function (data) {
                        console.log(data)
                    }
                })
                layer.close(index)
            }
        }))
}
$(".ifa").on('click', function () {
    console.log($(this).attr('value'))
    let _content = "<div style='margin:15px'><p>将当前课题初始值更新为：</p>"
    let val = {}
    $.ajax({
        url: '/projectSystem/get_requirement_content/',
        data: {'process_id': $(this).attr('value')},
        type: 'post',
        async: false,
        success: function (data) {
            $.each(data.info, function (k, v) {
                console.log(k, v)
                if (k !== 'id') {
                    val[k] = v
                }
            })
            _content += data.html + "</div>";
            // redirect to creation panel
            console.log(val)
        }
    })
    displayRequirement(_content, val);

})

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

