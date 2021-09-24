/**
 * 项目信息－添加生产安排
 * Created by wrb on 2018/10/23.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_production_copy",
        defaults = {
            isDialog: true,
            sourceId: null,//数据源id taskId
            sourceTaskList: null,
            designer: null,//任务负责人
            saveCallBack: null//回调函数

        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;//当前组织ID

        this._projectList = [];
        this._taskList = [];
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_production/m_production_copy', {});
            that.renderDialog(html, function () {

                that.initICheck();
                that.initSelect2ByProjectId();
                that.save_validate();

            });
        }
        //渲染界面
        , renderDialog: function (html, callBack) {

            var that = this;
            if (that.settings.isDialog === true) {//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title || '复制任务',
                    area: '750px',
                    content: html,
                    cancel: function () {
                    },
                    ok: function () {

                        var flag = $(that.element).find('form').valid();
                        if (!flag || that.save()) {
                            S_toastr.error($(that.element).find('form label.error:visible').eq(0).text());
                            return false;
                        }
                    }

                }, function (layero, index, dialogEle) {//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if (callBack)
                        callBack();
                });

            } else {//不以弹窗编辑

                $(that.element).html(html);
                if (callBack)
                    callBack();
            }
        }
        , initICheck: function () {
            var that = this;
            var ifChecked = function (e) {
                var $this = $(this);
            };
            var ifUnchecked = function (e) {
                var $this = $(this);
            };
            var ifClicked = function (e) {

                var copyFileId = $(this).val();
                if (copyFileId == 1) {
                    $(that.element).find('#fileCopyContent').show();
                } else {
                    $(that.element).find('#fileCopyContent').hide();
                }
            };
            $(that.element).find('input[name="copyFile"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked).on('ifClicked', ifClicked);

            var ifClicked = function (e) {

            };
            $(that.element).find('input[name="copyEmptyFile"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifClicked', ifClicked);
        }
        , initSelect2ByProjectId: function () {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_getProjectTaskList;
            option.postData = {};

            if (that.settings.designer != null) {
                option.postData.taskLeader = that.settings.designer.companyUserId;
            }

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    var data = [];
                    if (response.data) {
                        $.each(response.data, function (i, item) {
                            data.push({id: item.id, text: item.projectName,taskList:item.taskList});
                        });
                    }
                    that._projectList = response.data;

                    $(that.element).find('select[name="projectId"]').select2({
                        tags: false,
                        allowClear: false,
                        //containerCssClass:'select-sm',
                        language: "zh-CN",
                        placeholder: '请选择项目',
                        minimumResultsForSearch: -1,
                        data: data
                    });
                    $(that.element).find('select[name="projectId"]').on("change", function (e) {

                        var projectId = $(this).val();
                        that.initSelect2ByTargetId(projectId);
                    });
                    if (data && data.length > 0) {
                        $(that.element).find('select[name="projectId"]').val(data[0].id).trigger('change');
                    } else {
                        $(that.element).find('select[name="projectId"]').val('').trigger('change');
                    }


                } else {
                    S_layer.error(response.info);
                }
            });

        }
        , initSelect2ByTargetId: function (projectId) {
            var that = this;

            that._taskList = [];
            var project = getObjectInArray(that._projectList, projectId);
            if (project) {
                that._taskList = project.taskList;
            }

            var data = [];
            if (that._taskList) {
                $.each(that._taskList, function (i, item) {
                    data.push({id: item.id, text: item.taskName});
                });
            }
            if ($(that.element).find('select[name="targetId"]').next('.select2-container').length > 0)
                $(that.element).find('select[name="targetId"]').select2('destroy').empty();

            $(that.element).find('select[name="targetId"]').select2({
                tags: false,
                allowClear: false,
                //containerCssClass:'select-sm',
                language: "zh-CN",
                //placeholder:'请选择任务',
                minimumResultsForSearch: -1,
                data: data
            });

        }
        //保存签发
        , save: function () {
            var options = {}, that = this;
            var $form = $(that.element).find('form');

            options.url = restApi.url_copyForProductTask;

            options.postData = $form.serializeObject();
            options.postData.sourceId = that.settings.sourceId;
            options.postData.sourceTaskList = that.settings.sourceTaskList;
            options.postData.copyFile = 0;
            options.postData.copyEmptyFile = null;

            m_ajax.postJson(options, function (response) {

                if (response.code == '0') {
                    S_toastr.success('操作成功！');
                    if (that.settings.saveCallBack)
                        that.settings.saveCallBack();
                } else {
                    S_layer.error(response.info);
                }
            })
        }
        //保存验证
        , save_validate: function () {
            var that = this;
            $(that.element).find('form').validate({
                rules: {
                    projectId: {
                        required: true
                    },
                    targetId: {
                        required: true
                    }
                },
                messages: {
                    projectId: {
                        required: '请选择项目'
                    },
                    targetId: {
                        required: '请选择任务'
                    }
                },
                errorElement: "label",  //用来创建错误提示信息标签
                errorPlacement: function (error, element) {  //重新编辑error信息的显示位置

                    error.appendTo(element.closest('.col-24-sm-17'));

                }
            });
        }

    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            // if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            // }
        });
    };

})(jQuery, window, document);
