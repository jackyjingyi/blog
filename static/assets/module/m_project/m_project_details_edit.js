/**
 * 项目信息－项目详情编辑
 * Created by wrb on 2019/1/28.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_details_edit",
        defaults = {
            dataInfo:null,//任务数据
            projectId:null,
            projectName:null,
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._currentCompanyUserId = window.currentCompanyUserId;//员工ID
        this._currentCompanyId = window.currentCompanyId;//组织ID
        this._currentUserId = window.currentUserId;//用户ID
        this._fastdfsUrl = window.fastdfsUrl;//文件地址

        this._dataInfo = {};//请求数据

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            that.renderPage();
        },
        //渲染初始界面
        renderPage:function () {
            var that = this;
            var html = template('m_project/m_project_details_edit',{
                dataInfo:that.settings.dataInfo,
                projectId:that.settings.projectId
            });
            $(that.element).html(html);

            $(that.element).find('#remarkEditor').m_text_editor({
                isVideo:false,
                placeholder:'请输入项目描述',
                onInit:function () {
                    $(that.element).find('#remarkEditor .summernote').summernote('code', that.settings.dataInfo.taskRemark);
                }
            },true);
            that.bindActionClick();
        }
        //保存基本信息
        ,saveProjectData: function () {
            var that = this;
            var options = {};
            options.url = restApi.url_project;
            options.classId = '#content-right';
            options.postData = {};
            options.postData.projectRemark =  $(that.element).find('#remarkEditor .summernote').summernote('code');
            options.postData.id = that.settings.projectId;
            m_ajax.postJson(options, function (response) {
                if (response.code == '0') {

                    S_toastr.success('保存成功！');
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action],button[data-action]').off('click').on('click',function () {
                var $this = $(this),dataAction = $this.attr('data-action');
                switch (dataAction){

                    case 'cancel'://取消
                        $('#content-right').m_project_details({
                            projectId : that.settings.projectId,
                            projectName : that.settings.projectName
                        },true);
                        return false;
                        break;
                    case 'submit'://提交
                        that.saveProjectData();
                        return false;
                        break;
                }
            });
        }
    });

    /*
     1.一般初始化（缓存单例）： $('#id').pluginName(initOptions);
     2.强制初始化（无视缓存）： $('#id').pluginName(initOptions,true);
     3.调用方法： $('#id').pluginName('methodName',args);
     */
    $.fn[pluginName] = function (options, args) {
        var instance;
        var funcResult;
        var jqObj = this.each(function () {

            //从缓存获取实例
            instance = $.data(this, "plugin_" + pluginName);

            if (options === undefined || options === null || typeof options === "object") {

                var opts = $.extend(true, {}, defaults, options);

                //options作为初始化参数，若args===true则强制重新初始化，否则根据缓存判断是否需要初始化
                if (args === true) {
                    instance = new Plugin(this, opts);
                } else {
                    if (instance === undefined || instance === null)
                        instance = new Plugin(this, opts);
                }

                //写入缓存
                $.data(this, "plugin_" + pluginName, instance);
            }
            else if (typeof options === "string" && typeof instance[options] === "function") {

                //options作为方法名，args则作为方法要调用的参数
                //如果方法没有返回值，funcReuslt为undefined
                funcResult = instance[options].call(instance, args);
            }
        });

        return funcResult === undefined ? jqObj : funcResult;
    };

})(jQuery, window, document);
