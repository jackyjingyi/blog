/**
 * 添加协同任务
 * Created by wrb on 2019/11/25.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_light_project_add",
        defaults = {
            isDialog:true,
            title:null,
            dataInfo:null,
            templateId:null,
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._projectInfo = null;

        if(isNullOrBlank(this.settings.templateId)){
            this.settings.title = '完善任务信息';
            this.settings.width = '750px';
        }

        this._principalFlag = 0;//flag：0：负责人保持不变，1.更换负责人（并且 选择 原负责人依旧在轻量任务中，2：更换负责人,原负责人不在轻量任务重
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.getProjectInfo(function () {
                var html = template('m_light_project/m_light_project_add', {
                    dataInfo:that.settings.dataInfo,
                    projectInfo:that._projectInfo,
                    templateId:that.settings.templateId
                });
                that.renderDialog(html,function () {

                    that.bindActionClick();
                    that.initGroupSelect2();
                    that.initPrincipalSelect2();
                    that.initStatusSelect2();
                });
            });

        }
        //渲染界面
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'创建任务',
                    area : that.settings.width || '800px',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        var flag = $(that.element).find('form').valid();


                        var principalUsrId = $(that.element).find('select[name="principalUsrId"]').val();
                        if(that.settings.dataInfo && that.settings.dataInfo.id && isNullOrBlank(that.settings.templateId)　&& that.settings.dataInfo.principalUsr && principalUsrId!=that.settings.dataInfo.principalUsr.id){

                            S_layer.dialog({
                                title: '提示',
                                area :'300px',
                                content:'<div class="p-lg">负责人已更改，是否保留原有负责人为项目的参与人？</div>',
                                cancelText:'否',
                                okText:'是',
                                cancel:function () {
                                    that._principalFlag = 2;
                                    that.save();
                                    S_layer.close();
                                },
                                ok:function () {
                                    that._principalFlag = 1;
                                    that.save();
                                    S_layer.close();
                                }

                            },function(layero,index,dialogEle){//加载html后触发
                            });
                            return false;

                        }else{
                            if (!flag || that.save()) {
                                return false;
                            }
                        }

                    }

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack)
                        callBack();
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }
        }
        ,initGroupSelect2:function () {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_lightProject_listGroup;
            option.postData = {};
            option.postData.type = 1;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    if($(that.element).find('select[name="groupId"]').next('.select2-container').length>0)
                        $(that.element).find('select[name="groupId"]').select2('destroy').empty();

                    var data = [{id:'',text:'请选择'}];
                    $.each(response.data, function (i, o) {
                        if(!isNullOrBlank(o.name)){
                            data.push({
                                id: o.id,
                                text: o.name
                            });
                        }
                    });
                    $(that.element).find('select[name="groupId"]').select2({
                        allowClear: false,
                        language: "zh-CN",
                        width: '100%',
                        minimumResultsForSearch: Infinity,
                        //placeholder: "请选择任务分组!",
                        data: data
                    });

                    if(that.settings.dataInfo && that.settings.dataInfo.groupId){
                        $(that.element).find('select[name="groupId"]').val(that.settings.dataInfo.groupId).trigger('change');
                    }


                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,getProjectInfo:function (callBack) {
            var that = this;
            if(that.settings.templateId){

                var option = {};
                option.classId = that.element;
                option.url = restApi.url_lightProject_listLightProjectDetail;
                option.postData = {};
                option.postData.id = that.settings.templateId;

                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {
                        that._projectInfo = response.data;
                        if(callBack)
                            callBack();

                    } else {
                        S_layer.error(response.info);
                    }
                });
            }else{
                if(callBack)
                    callBack();
            }

        }
        //渲染负责人选择select2
        ,initPrincipalSelect2:function(){
            var that = this;
            var value =[];
            if(that.settings.dataInfo && that.settings.dataInfo.principalUsr){
                value=[{id:that.settings.dataInfo.principalUsr.id,text:that.settings.dataInfo.principalUsr.userName}]
            }
            $(that.element).find('select[name="principalUsrId"]').m_select2_by_search({
                type:1,
                isCookies:false,
                changeCallBack:function (data) {
                    console.log(data)
                },
                option:{
                    multiple:false,
                    isClear:true,
                    url:restApi.url_getUserByKeyWord,
                    value:value
                }},true);
        }
        //渲染状态选择select2
        ,initStatusSelect2:function(){
            var that = this;
            $(that.element).find('select[name="status"]').select2({
                tags:false,
                allowClear: false,
                //containerCssClass:'select-sm',
                language: "zh-CN",
                minimumResultsForSearch: -1
            });
            if(that.settings.dataInfo && that.settings.dataInfo.status){
                $(that.element).find('select[name="status"]').val(that.settings.dataInfo.status).trigger('change');
            }
        }
        //保存
        ,save:function () {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_lightProject_saveLightProject;
            option.postData = $(that.element).find("form").serializeObject();
            option.postData.type = 0;
            if(that.settings.templateId){
                option.postData.templateId = that.settings.templateId;
            }

            if(that.settings.dataInfo && that.settings.dataInfo.id){
                option.postData.id = that.settings.dataInfo.id;

                //编辑项目
                if(isNullOrBlank(that.settings.templateId)){
                    option.postData.flag = that._principalFlag;
                }
            }
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    S_toastr.success('操作成功！');


                    if((that.settings.dataInfo==null || that.settings.dataInfo.id==null) && response.data){//添加

                        location.hash = '#/lightProject/detail?id='+response.data;
                        S_layer.close();
                    }else{
                        if(that.settings.saveCallBack)
                            that.settings.saveCallBack();
                    }

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function (e) {
                var $this = $(this);
                var dataAction = $this.attr('data-action');

                switch (dataAction){

                    case 'editGroup'://创建分组

                        $this.m_floating_popover({
                            content: '<div class="add-group"></div>',
                            placement: 'bottomRight',
                            popoverClass:'z-index-layer',
                            renderedCallBack: function ($popover) {
                                $popover.find('.add-group').m_input_save({
                                    isDialog:false,
                                    postData:{type:1},
                                    postUrl:restApi.url_lightProject_saveGroup,
                                    fieldKey:'groupName',
                                    fieldName:'分组名称',
                                    saveCallBack:function () {
                                        $this.m_floating_popover('closePopover');//关闭浮窗
                                        that.initGroupSelect2();
                                    },
                                    cancelCallBack:function () {
                                        $this.m_floating_popover('closePopover');//关闭浮窗
                                    }

                                });
                            }
                        }, true);
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
