/**
 * 项目信息－生产安排详情-左导航树
 * Created by wrb on 2020/5/20.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_task_issue_details_nav",
        defaults = {
            treeUrl:null,
            param:null,
            taskType:null,//详情是生产=0、订单=2、子项=1
            projectName:null,
            dataCompanyId:null,//视图ID
            createCompanyId:null,//任务创建组织
            selectedId:null,//选中某节点
            selectedCallBack:null//选中回滚事件
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.getData(function (data) {
                var html = template('m_task_issue/m_task_issue_details_nav',{
                    projectId:that.settings.projectId,
                    projectName:encodeURI(that.settings.projectName),
                    dataCompanyId:that.settings.dataCompanyId,
                    dataList:data,
                    createCompanyId:that.settings.createCompanyId,
                    currentCompanyId:window.currentCompanyId
                });
                $(that.element).html(html);
                $(that.element).find('.tree').treegrid(
                    {
                        expanderExpandedClass: 'ic-open',
                        expanderCollapsedClass: 'ic-retract',
                        treeColumn: 0
                    }
                );
                stringCtrl($('.task-name'),300,true);
                that.bindAClick();
                if(that.settings.selectedId){
                    $(that.element).find('tr.tree-box-tr[data-id="'+that.settings.selectedId+'"]').addClass('selected');
                }


            });
        }
        //渲染列表
        ,getData:function (callBack) {
            var that = this;
            var option={};
            option.classId = '#content-right';
            option.url = that.settings.treeUrl?that.settings.treeUrl:restApi.url_getProjectIssueTree;
            option.postData = {};
            if(that.settings.param)
                option.postData = that.settings.param;

            m_ajax.postJson(option,function (response) {

                if(response.code=='0'){
                    that._dataInfo = response.data;
                    if(callBack)
                        callBack(response.data);

                }else {
                    S_layer.error(response.info);
                }
            })
        }
        ,bindAClick:function () {
            var that = this;
            $(that.element).find('.task-name').on('click',function () {

                var $tr = $(this).closest('tr');
                var id = $tr.attr('data-id');
                var dataItem = getObjectInArray(that._dataInfo,id);
                $tr.addClass('selected').siblings().removeClass('selected');
                if(that.settings.selectedCallBack)
                    that.settings.selectedCallBack(dataItem);
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
