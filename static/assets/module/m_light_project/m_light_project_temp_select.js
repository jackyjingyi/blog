/**
 * 轻量任务模板选择
 * Created by wrb on 2019/11/25.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_light_project_temp_select",
        defaults = {
            isDialog:true,
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._currentCompanyUserId = window.currentCompanyUserId;

        this._currPageType = 1;//1=最近模板，2=全部模板
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.listRecentlyTemplate(function (data) {
                var html = template('m_light_project/m_light_project_temp_select', {dataList:data});
                that.renderDialog(html,function () {

                    that.bindActionClick();
                });
            });
        }
        //渲染界面
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'选择任务模板',
                    area : ['960px','650px'],
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {


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
        ,listRecentlyTemplate:function (callBack) {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_lightProject_listRecentlyTemplate;
            option.postData = {};
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    if(callBack)
                        callBack(response.data);


                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,listTemplate:function (callBack) {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_lightProject_listTemplate;
            option.postData = {};
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    if(callBack)
                        callBack(response.data);


                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,searchTemplate:function (projectName,callBack) {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_lightProject_searchTemplate;
            option.postData = {projectName:projectName};
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    if(callBack)
                        callBack(response.data);


                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,renderPage1:function () {
            var that = this;
            that.listRecentlyTemplate(function (data) {
                that._currPageType = 1;
                var html = template('m_light_project/m_light_project_temp_select', {dataList:data});
                $(that.element).html(html);
                $(that.element).parents('.layui-layer').find('.layui-layer-title').html('选择任务模板');
                $(that.element).parents('.layui-layer').find('a[data-action="back"]').remove();
                that.bindActionClick();
            });

        }
        ,renderPage2:function () {
            var that = this;
            that.listTemplate(function (data) {
                that._currPageType = 2;
                var html = template('m_light_project/m_light_project_temp_all', {dataList:data});
                $(that.element).html(html);
                that.bindActionClick();

                //$(that.element).parents('.layui-layer').find('.layui-layer-title').prepend('<a data-action="back" href="javascript:void(0)" class="m-r-sm"><i class="fa fa-angle-left f-s-lg"></i></a>')
                $(that.element).parents('.layui-layer').prepend('<a data-action="back" href="javascript:void(0)" class="m-r-sm" style="position: absolute;top: 11px;left: 18px;"><i class="fa fa-angle-left f-s-lg"></i></a>');
                $(that.element).parents('.layui-layer').find('.layui-layer-title').html('&nbsp;&nbsp;&nbsp;&nbsp;选择任务模板');
                $('.layui-layer a[data-action="back"]').on('click',function () {

                    that.renderPage1();
                    return false;
                });
            });
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('div[data-action],button[data-action]').off('click').on('click',function (e) {
                var $this = $(this);
                var dataAction = $this.attr('data-action');

                switch (dataAction){
                    case 'allTaskTemp'://全部模板

                        that.renderPage2();

                        break;

                    case 'addTaskTemp'://新建模板

                        //$('body').m_light_project_temp_add();
                        location.hash = '#/lightProject/addTemp';
                        S_layer.close($(e.target));
                        break;

                    case 'addLightProject'://创建轻量任务

                        $('body').m_light_project_add({
                            saveCallBack:function () {
                                if(that.settings.saveCallBack)
                                    that.settings.saveCallBack();
                            }
                        });
                        break;

                    case 'addLightProjectByTemp':
                        $('body').m_light_project_add({
                            templateId:$this.attr('data-id'),
                            saveCallBack:function () {
                                if(that.settings.saveCallBack)
                                    that.settings.saveCallBack();
                            }
                        });
                        break;
                    case 'delProjectTemp'://删除任务
                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {

                            var option = {};
                            option.url = restApi.url_lightProject_deleteLightProject;
                            option.postData = {};
                            option.postData.id = $this.closest('.task-temp-box').attr('data-id');
                            m_ajax.postJson(option, function (response) {
                                if (response.code == '0') {
                                    S_toastr.success('删除成功！');
                                    that.renderPage2();

                                } else {
                                    S_layer.error(response.info);
                                }
                            });

                        }, function () {
                        });
                        break;
                    case 'editProjectTemp':

                        S_layer.dialog({
                            area : ['100%','100%'],
                            content:'<div id="editProjectTemp"></div>',
                            closeBtn:0,
                            fixed:true,
                            scrollbar:false,
                            //anim:1,
                            btn:false

                        },function(layero,index,dialogEle){//加载html后触发

                            $(dialogEle).find('#editProjectTemp').m_light_project_detail({
                                doType:1,
                                dataInfo:{backgroundImage:$this.closest('.task-temp-box').attr('data-image')},
                                query:{id:$this.closest('.task-temp-box').attr('data-id'),fromType:2},
                                closeCallBack:function () {
                                    that.renderPage2();
                                }
                            },true);
                        });

                        break;

                    case 'editTempGroup'://编辑模板分组

                        var postData={type:1},fieldValue = null;
                        if($this.closest('.list-group-item').length>0){
                            fieldValue = $this.closest('.list-group-item').find('.group-name').text();
                            postData.id = $this.closest('.list-group-item').attr('data-id');

                        }

                        $this.m_floating_popover({
                            content: '<div class="add-group"></div>',
                            placement: 'bottomRight',
                            popoverClass:'z-index-layer',
                            renderedCallBack: function ($popover) {
                                $popover.find('.add-group').m_input_save({
                                    isDialog:false,
                                    postData:postData,
                                    postUrl:restApi.url_lightProject_saveTemplateGroup,
                                    fieldKey:'groupName',
                                    fieldName:'分组名称',
                                    fieldValue:fieldValue,
                                    saveCallBack:function () {
                                        $this.m_floating_popover('closePopover');//关闭浮窗
                                        that.renderPage2();
                                    },
                                    cancelCallBack:function () {
                                        $this.m_floating_popover('closePopover');//关闭浮窗
                                    }

                                });
                            }
                        }, true);
                        break;
                    case 'delTempGroup':
                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {

                            var $group = $this.closest('.list-group-item');
                            var option = {};
                            option.url = restApi.url_lightProject_deleteLightProjectTemplateGroup;
                            option.postData = {};
                            option.postData.id = $group.attr('data-id');
                            m_ajax.postJson(option, function (response) {
                                if (response.code == '0') {
                                    S_toastr.success('删除成功！');
                                    that.renderPage2();

                                } else {
                                    S_layer.error(response.info);
                                }
                            });

                        }, function () {
                        });
                        break;
                }
                return false;
            });

            //定位
            $(that.element).find('.list-group .list-group-item').off('click').on('click',function () {
                var id = $(this).attr('data-id');
                var t = $(that.element).find('h3[data-id="'+id+'"]').position().top;
                var scrollTop = $(that.element).find('.temp-list-box').scrollTop();
                $('.layer-new .layui-layer-content .temp-list-box').scrollTop(t+scrollTop);
            });

            $(that.element).find('input[name="keyword"]').bind('input propertychange change',function(event){

               //console.log('input propertychange change');
               var projectName = $(this).val();
               if(isNullOrBlank(projectName)){

                   if(that._currPageType==1){
                       that.renderPage1();
                   }else{
                       that.renderPage2();
                   }

               }else{
                   that.searchTemplate(projectName,function (data) {

                       var html = template('m_light_project/m_light_project_temp_search', {dataList:data,projectName:projectName});
                       $(that.element).html(html);
                       that.bindActionClick();

                       $(that.element).find('input[name="keyword"]').val('').focus().val(projectName)

                   });
               }
            });

            $(that.element).find('.list-group .list-group-item').hover(function () {
                $(this).find('button').removeClass('hide');
            },function () {
                $(this).find('button').addClass('hide');
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
