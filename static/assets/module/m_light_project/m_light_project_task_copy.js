/**
 * 复制工作项
 * Created by wrb on 2019/12/6.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_light_project_task_copy",
        defaults = {
            isDialog:true,
            doType:1,//1=复制，2=移动
            taskId:null,
            lightProjectId:null,
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this.$popover = null;
        this._titlePrefix = '复制';

        if(this.settings.doType==2){
            this._titlePrefix = '移动';
        }

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_light_project/m_light_project_task_copy', {
                dataInfo:that.settings.dataInfo,
                titlePrefix:that._titlePrefix
            });
            $(that.element).m_floating_popover({
                content: html,
                placement: 'bottomLeft',
                popoverClass: 'z-index-layer',
                popoverStyle:{'box-shadow':'none','width':'265px'},
                renderedCallBack: function ($popover) {

                    that.$popover = $popover;
                    that.initProjectSelect2();
                    //that.initProjectGroupSelect2();
                    that.bindActionClick();
                }
            }, true);
        }

        ,initProjectSelect2:function () {
            var that = this;
            var option = {};
            option.url = restApi.url_lightProject_listLightProject;
            option.postData = {};

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    var data = [];
                    if(response.data.data){
                        $.each(response.data.data,function (i,item) {
                            data.push({id:item.id,text:item.projectName});
                        });
                    }
                    that.$popover.find('select[name="projectList"]').select2({
                        tags:false,
                        allowClear: false,
                        //containerCssClass:'select-sm',
                        width:'230px',
                        language: "zh-CN",
                        //placeholder:'请选择任务',
                        minimumResultsForSearch: -1,
                        data:data
                    });

                    that.$popover.find('select[name="projectList"]').on("change", function (e) {
                        var projectId = $(this).val();
                        that.initProjectGroupSelect2(projectId);
                    });

                    if(that.settings.lightProjectId){
                        that.$popover.find('select[name="projectList"]').val(that.settings.lightProjectId).trigger('change');
                    }
                    else if(data && data.length>0 && data[0].id){
                        that.$popover.find('select[name="projectList"]').val(data[0].id).trigger('change');
                    }

                } else {
                    S_layer.error(response.info);
                }
            });

        }
        ,initProjectGroupSelect2:function (projectId) {
            var that = this;
            var option = {};
            option.url = restApi.url_lightProject_listGroupByProjectId;
            option.postData = {};
            option.postData.id = projectId;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    if(that.$popover.find('select[name="groupList"]').next('.select2-container').length>0){
                        that.$popover.find('select[name="groupList"]').select2('destroy').empty();
                    }


                    var data = [];
                    if(response.data && response.data.length>0){
                        $.each(response.data,function (i,item) {
                            data.push({id:item.id,text:item.name});
                        });
                    }
                    that.$popover.find('select[name="groupList"]').select2({
                        tags:false,
                        allowClear: false,
                        width:'230px',
                        //containerCssClass:'select-sm',
                        language: "zh-CN",
                        //placeholder:'请选择任务',
                        minimumResultsForSearch: -1,
                        data:data
                    });

                } else {
                    S_layer.error(response.info);
                }
            });

        }
        //移动或复制
        ,saveMoveTask:function (groupId) {
            var that = this;

            var projectId = that.$popover.find('select[name="projectList"]').val();
            var groupId = that.$popover.find('select[name="groupList"]').val();

            var option = {};
            option.classId = that.element;
            option.url = restApi.url_lightProject_copyLightProjectTask;

            if(that.settings.doType==2){
                option.url = restApi.url_lightProject_moveLightProjectTask;
            }

            option.postData = {};
            option.postData.id = that.settings.taskId;
            option.postData.lightProjectId = projectId;
            option.postData.groupId = groupId;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    S_toastr.success('操作成功！');
                    $(that.element).m_floating_popover('closePopover');//关闭浮窗
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack({lightProjectId:projectId,groupId:groupId});

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,bindActionClick:function () {
            var that = this;
            that.$popover.find('button[data-action]').off('click').on('click',function (e) {
                var $this = $(this);
                var dataAction = $this.attr('data-action');

                switch (dataAction){

                    case 'closeDialog':

                        $(that.element).m_floating_popover('closePopover');//关闭浮窗

                        break;
                    case 'save'://保存

                        var projectId = that.$popover.find('select[name="projectList"]').val();
                        var groupId = that.$popover.find('select[name="groupList"]').val();
                        if(isNullOrBlank(projectId)){
                            S_toastr.error('请选择看板');
                            return false;
                        }
                        if(isNullOrBlank(groupId)){
                            S_toastr.error('请选择版块');
                            return false;
                        }
                        that.saveMoveTask();
                        break;


                }
                return false;
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
