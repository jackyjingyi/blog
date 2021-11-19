$(document).ready(function () {
            const csrftoken = getCookie('csrftoken');
            const processID = "{{ process.pk }}"
            const attachmentTargetID = "{{ attachment.get_attachment.first.pk }}"
            const attachURL = '/projectSystem/projectRequirements/' + attachmentTargetID + "/"
            const attachmentUUID = "{{ attachment.pk }}";
            let updateForm = $("#update_project");
            let formStatusChange = function (form, action) {
                form.find('input,textarea,select').each(function () {
                    if ($(this).attr("disabled") !== action) {
                        $(this).attr("disabled", action);
                    }
                });
            };
            let setUpdateStep = function (processID, attachmentID) {
                $.ajax({
                    url: '/projectSystem/updateAttachment/',
                    data: {
                        'process_id': processID,
                        'attachment_id': attachmentID,
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
            $("a[data-action='upload']").on('click', function () {
                // use siblings not next ,cause a div tag will insert in
                let inputTag = $(this).parent().siblings().last();
                let prepVal = inputTag.val()
                if (inputTag.attr('disabled')) {
                    let t = $(this).attr("data-target")
                    inputTag.attr('disabled', false);
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
                        let inputTag = $(this).parent().siblings().last();
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
                                success: function (data) {
                                    inputTag.val(data[attachmentRequirementKey]);
                                    setUpdateStep(processID, attachmentUUID);
                                }
                            })
                        }

                        inputTag.attr('disabled', true);
                        $(this).attr('style', 'visibility: hidden');
                        $(this).next().attr('style', 'visibility: hidden');
                    });
                    $("a[data-action=uploadCancel]").on('click', function () {
                        let inputTag = $(this).parent().siblings().last();
                        inputTag.val(prepVal);
                        inputTag.attr('disabled', true);
                        $(this).attr('style', 'visibility: hidden');
                        $(this).prev().attr('style', 'visibility: hidden');
                    });
                }
            });
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
                let resignValue = function (ele, vl) {
                    ele.find('input,textarea,select').each(function () {
                            $(this).val(vl[$(this).attr("name")]);
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
                    console.log(prevValue, currentValues)
                    $.ajax({
                        url: attachURL,
                        type: 'put',
                        contentType: 'application/json',
                        data: JSON.stringify(currentValues),
                        headers: {'X-CSRFToken': csrftoken},
                        success: function (data) {
                            resignValue(updateForm, data)
                        },
                        error: function (data) {
                            console.log(data)
                        }
                    })
                    formStatusChange(updateForm, true);
                    $(this).hide();
                    $(this).prev().show();
                    $(this).next().hide();
                    setUpdateStep(processID, attachmentUUID);
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
                    console.log(ct)
                    this.setOptions({
                        maxDate: $('#project_end_time').val() ? $('#project_end_time').val() : false
                    })
                },

            });
            $('#project_end_time').datetimepicker({
                format: 'Y-m-d H:i',
                onShow: function (ct) {
                    console.log(ct)
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
        })