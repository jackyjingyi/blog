class Title {
    constructor(obj) {
        this.department = obj.department;
        this.id = obj.id;
        this.implements = [];
        this.progress_year = obj.progress_year;
        this.progress_season = obj.progress_season;
        this.project_base = obj.project_base;
        this.sponsor = obj.sponsor;
        this.main_tasks = obj.main_tasks; // change model structure
    }

    update(obj) {
        this.department = obj.department;
        this.id = obj.id;
        this.implements = [];
        this.progress_year = obj.progress_year;
        this.progress_season = obj.progress_season;
        this.project_base = obj.project_base;
        this.sponsor = obj.sponsor;
    }

    static get_instance(id) {
        for (let i of this.instances) {
            if (i.id === id) {
                return i
            }
        }
    }

    create_implement(implments) {
        if (implments.length > 0) {
            for (let i of implments) {

                let _tmp = Implement.create(i)
                this.implements.push(_tmp)
            }
        }
    }

    create_main_tasks(maintasks) {
        console.log(maintasks)
        if (maintasks.length > 0) {
            for (let i of maintasks) {
                let _tmp = new MainTask(i)
                this.main_tasks.push(_tmp)
            }
        }
    }

    static instances = new Set();
    static instances_id = new Set();

    static create(obj) {
        console.log(obj)
        if (this.instances_id.has(obj.id)) {
            let z = Title.get_instance(obj.id);
            z.update(obj)
            z.create_main_tasks(obj.main_tasks);
            return z
        } else {
            let tmp = new Title(obj)
            this.instances_id.add(tmp.id);
            this.instances.add(tmp);
            tmp.create_main_tasks(obj.main_tasks);
            return tmp
        }
    }
}

class DisplayPanel {
    static hasObj = false
    static titleForm = $("#create_title");
    static titleComponents = {
        'department': $("#department"),
        'progress_year': $("#progress_year1"),
        'progress_season': $("#progress_season1"),
        'sponsor': $("#sponsor")
    }

    static titleInformation = {
        'base_id': objPr,
        'id': null,
        'department': null,
        'progress_year': null,
        'progress_season': null,
        'sponsor': null,
    }


    static retrieve(obj) {
        this.titleComponents.department.val(obj.department);
        this.titleComponents.progress_year.val(obj.progress_year);
        this.titleComponents.progress_season.val(obj.progress_season);
        this.titleComponents.sponsor.val(obj.sponsor);
        this.titleInformation.id = obj.id;
        this.titleInformation.department = obj.department;
        this.titleInformation.progress_year = obj.progress_year;
        this.titleInformation.progress_season = obj.progress_season;
        this.titleInformation.sponsor = obj.sponsor;
        this.titleComponents.department.attr("disabled", "disabled");
        this.titleComponents.progress_year.attr("disabled", "disabled");
        this.titleComponents.progress_season.attr("disabled", "disabled");
        this.titleComponents.sponsor.attr("disabled", "disabled");
    }

    static init() {
        if (!this.hasObj) {
            this.titleComponents.progress_year.val($("#progress_year0").val())
            this.titleComponents.progress_season.val($("#progress_season0").val())
            this.titleInformation.id = null;
            this.titleInformation.department = null;
            this.titleInformation.progress_year = this.titleComponents.progress_year.val();
            this.titleInformation.progress_season = this.titleComponents.progress_year.val();
            this.titleInformation.sponsor = null;
        }
    }

    static update() {

        if (this.titleForm[0].checkValidity() === false) {
            this.titleForm[0].reportValidity();
        } else {
            let newTitle = {}
            assignValue(this.titleForm, newTitle);
            let create_url = "/projectSystem/Project/implementTitle/detail/" + this.titleInformation.id + "/"
            $.ajax({
                url: create_url,
                data: newTitle,
                headers: {'X-CSRFToken': csrftoken},
                type: 'patch',
                success: function (data) {
                    console.log(data)
                    let tmp = Title.create(data)
                    DisplayPanel.reset()
                    DisplayPanel.retrieve(tmp)
                },
                error: function (edata) {
                    console.log(edata)
                }
            })
        }

    }

    static getTitle(baseid, year, season) {
        let get_url = "/projectSystem/Project/implementTitle/?project_base=" + baseid + "&progress_year=" + year + "&progress_season=" + season + "/"
        console.log(get_url)
        $.ajax({
            url: get_url,
            type: 'get',
            success: function (success_data) {
                console.log(success_data)
                if (success_data.length > 0) {
                    // assign values into title field
                    console.log(success_data)
                    let title = Title.create(success_data[0]);
                    DisplayPanel.reset()
                    DisplayPanel.retrieve(title)
                    DisplayPanel.hasObj = true;
                } else {
                    DisplayPanel.reset();
                    DisplayPanel.hasObj = false;
                }
            },
            error: function (error_data) {
                console.log(error_data)
            }


        })

    }

    static create() {
        // todo click save => ()
        // 1 check if obj exists
        if (this.hasObj) {
            // update
            this.update()
        } else {
            // create
            // do not call create here, call title.create()
            if (this.titleForm[0].checkValidity() === false) {
                this.titleForm[0].reportValidity();
            } else {
                let newTitle = {}
                assignValue(this.titleForm, newTitle);
                let create_url = "/projectSystem/Project/implementTitle/"     // create implement title
                $.ajax({
                    url: create_url,
                    data: newTitle,
                    headers: {'X-CSRFToken': csrftoken},
                    type: 'post',
                    success: function (data) {
                        console.log(data)
                        let tmp = Title.create(data)
                        DisplayPanel.reset()
                        DisplayPanel.retrieve(tmp)
                        // todo create success
                    },
                    error: function (edata) {
                        console.log(edata)
                    }
                })
            }

        }

    }

    static reset() {
        this.titleComponents.department.val('');
        this.titleComponents.sponsor.val('');
        this.init();
        this.titleComponents.department.attr("disabled", false);
        this.titleComponents.progress_year.attr("disabled", "disabled");
        this.titleComponents.progress_season.attr("disabled", "disabled");
        this.titleComponents.sponsor.attr("disabled", false);
    }

    static change() {
        for (let k in this.titleComponents) {
            this.titleComponents[k].attr("disabled", false)
        }
    }

    getMainTasks() {

    }
}

class MainTask {
    constructor(obj) {
        this.id = obj.id;
        this.base = obj.base;
        this.issue = obj.issue;
        this.subtasks = obj.subtasks
    }

    static mainTaskLoader() {
        const pid = DisplayPanel.titleInformation.id
        const y = $("#progress_year1").val()
        const s = $("#progress_season1").val()
        if (DisplayPanel.hasObj) {
            return layer.ready(
                layer.open({
                    type: 1,
                    area: ['780px', '500px'],
                    shadeClose: true, //点击遮罩关闭
                    title: '创建重点工作事项',
                    content:
                        "<div class='col-md-8 margin-top-15'>" +
                        "<p>创建课题《" + '{{ obj_pr.project_name }}' + "》 " + y + "年" + s + "季度重点工作事项</p>" +
                        "<form>" +
                        "<label>重点工作事项名称</label>" +
                        "<input class='form-control' value='' id='issuePost'/>" +
                        "</form>" +
                        "</div>" +
                        "<div class='col-md-8 margin margin-top-15 margin-left-5' id='infoBack'>" +
                        "</div>",
                    btn: ['确认', '取消'],
                    yes: function (index, layro) {
                        layer.close(index)
                        $.ajax({
                            url: "/projectSystem/Project/implement/task/main/",
                            type: "post",
                            data: {'base': pid, 'issue': $("#issuePost").val()},
                            headers: {'X-CSRFToken': csrftoken},
                            success: function (success_data) {
                                console.log(success_data)
                            },
                            error: function (error_data) {
                                console.log(error_data)
                                if (error_data.status === 500) {
                                    console.log(layro)
                                }

                            }
                        })
                        // ajax
                        // first check if name exists

                    }
                })
            );
        } else {
            return layer.ready(
                layer.open({
                    type: 1,
                    area: ['780px', '500px'],
                    shadeClose: true, //点击遮罩关闭
                    title: '创建重点工作事项',
                    content:
                        "<p>需要先创建标题</p>"
                })
            );
        }


    }

}

class SubTasks {
    constructor(obj) {
        this.id = obj.id;
        this.base = obj.base;
        this.project_task = obj.project_task;
        this.project_task_start_time = obj.project_task_start_time;
        this.project_task_end_time = obj.project_task_end_time;
        this.season_implement_progress = obj.season_implement_progress;
        this.season_implement_delay_explanation = obj.season_implement_delay_explanation;
        this.add_ups = obj.add_ups;
    }

}

class Implement {
    constructor(obj) {
        this.project_important_issue = obj.project_important_issue;
        this.project_task = obj.project_task;
        this.project_task_start_time = obj.project_task_start_time;
        this.project_task_end_time = obj.project_task_end_time;
        this.season_implement_progress = obj.season_implement_progress;
        this.season_implement_delay_explanation = obj.season_implement_delay_explanation;
        this.add_ups = obj.add_ups;
        this.project_important_issue_number = obj.project_important_issue_number;
        this.id = obj.id

    }

    set_id(id) {
        this.id = id;
    }

    set_row_id(rowid) {
        this.row_id = rowid;
    }

    set_project_base_id(base_id) {
        this.project_base = base_id
    }


    static instances = new Set();

    static instance_id = new Set();

    static get_instance(id) {
        for (let i of Implement.instances) {
            if (i.id === id) {
                return i
            }
        }
    }

    static get_instance_by_row_id(rid) {
        for (let i of Implement.instances) {
            if (i.row_id === rid) {
                return i
            }
        }
        return null
    }

    update(obj) {
        this.project_important_issue = obj.project_important_issue;
        this.project_task = obj.project_task;
        this.project_task_start_time = obj.project_task_start_time;
        this.project_task_end_time = obj.project_task_end_time;
        this.season_implement_progress = obj.season_implement_progress;
        this.season_implement_delay_explanation = obj.season_implement_delay_explanation;
        this.add_ups = obj.add_ups;
        this.id = obj.id;
        this.project_base = obj.project_base;

    }

    static create(obj) {

        if ('id' in obj) {
            // if id find => update
            if (Implement.instance_id.has(obj.id)) {
                let tmp = Implement.get_instance(obj.id);
                tmp.update(obj)
                return tmp
            } else {

                let tmp = new Implement(obj);
                Implement.instance_id.add(tmp.id)
                Implement.instances.add(tmp)
                return tmp
            }
        } else {
            let tmp = new Implement(obj);

            return tmp
        }

    }

    implement_post() {
        // create new instance

        if (this.id != null) {
            let url = "/projectSystem/Project/implement/detail/" + this.id + "/"
            let tmp = null
            console.log(this)
            $.ajax({
                url: url,
                data: this,
                type: "patch",
                async: false,
                headers: {'X-CSRFToken': csrftoken},
                success: function (success_data) {
                    // set id
                    tmp = Implement.create(success_data)
                },
                error: function (error_data) {
                    console.log(error_data)
                }
            })
        } else {
            let url = "/projectSystem/Project/implement/"
            let tmp = null

            $.ajax({
                url: url,
                data: this,
                type: "post",
                async: false,
                headers: {'X-CSRFToken': csrftoken},
                success: function (success_data) {
                    // set id
                    tmp = Implement.create(success_data)
                },
                error: function (error_data) {
                    console.log(error_data)

                }
            })
            return tmp
        }

    }

    before_post_put() {

        let _tr = $("#index" + this.row_id.toString()).parents("tr")

        _tr.find('input,textarea,select').each(function () {

            $(this).attr("disabled", "disabled");
        })

    }
}