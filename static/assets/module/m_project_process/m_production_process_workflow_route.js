/**
 * 生产安排-流程设置-流转设置
 * Created by wrb on 2019/6/13.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_production_process_workflow_route",
        defaults = {
            doType:1,//1=编辑，2=查看
            fromType:1,//1=默认生产安排入口，2=后台模板
            saveParam:null,//保存请求多余参数
            postParam:null,//请求多余参数
            query:null//{dataCompanyId,id(projectId),projectName,processType(1：生产任务:2：图纸:3：校审意见),processId}
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;//当前组织ID

        this._statusList = [];//状态列表

        this.settings.query.projectName = encodeURI(this.settings.query.projectName);
        this._breadcrumb = [
            {
                name:'我的项目'
            },
            {
                name:decodeURI(this.settings.query.projectName),
                url:getUrlParamStr('#/project/basicInfo',{
                    id:this.settings.query.id,
                    projectName:this.settings.query.projectName,
                    dataCompanyId:this.settings.query.dataCompanyId
                })
            },
            {
                name:'任务订单',
                url:getUrlParamStr('#/project/taskIssue',{
                    id:this.settings.query.id,
                    projectName:this.settings.query.projectName,
                    dataCompanyId:this.settings.query.dataCompanyId
                })
            },
            /*{
                name:'流程设置',
                url:getUrlParamStr('#/project/production/processSettings',{
                    id:this.settings.query.id,
                    projectName:this.settings.query.projectName,
                    dataCompanyId:this.settings.query.dataCompanyId
                })
            },*/
            {
                name:'流程设置',
                url:getUrlParamStr('#/project/taskIssue/processSettings/list',{
                    id:this.settings.query.id,
                    taskId:this.settings.query.taskId,
                    projectName:this.settings.query.projectName,
                    dataCompanyId:this.settings.query.dataCompanyId,
                    processType:this.settings.query.processType
                })
            },
            {
                name:'流转设置'
            }
        ];

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.getData(function () {
                var html = template('m_project_process/m_production_process_workflow_route',{
                    fromType:that.settings.fromType,
                    doType:that.settings.doType,
                    dataList:that._statusList
                });
                $(that.element).html(html);
                that.initICheck();
                that.bindActionClick();
                if(that.settings.doType==2){
                    $(that.element).find('input[name="itemCk"]').iCheck('disable');
                }
                that.bindDragFun();
                that.renderFlow();

                if($(that.element).find('#breadcrumb').length>0)
                    $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);
            });
        }
        //请求数据
        ,getData:function (callBack) {
            var that = this;
            var option = {};
            option.url = restApi.url_listProcessNodeRoute;
            option.postData = {
                processId:that.settings.query.processId
            };
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    that._statusList =  response.data;
                    if(callBack)
                        callBack();

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //渲染右边流程图
        ,renderFlow:function () {
            var that = this;
            var routeList = that.getSaveData();
            var processInfo = {
                routeList:routeList,
                process:{},
                statusList:that._statusList
            };
            $(that.element).find('#contentRight').m_production_process_info({processInfo:processInfo},true);
        }
        //获取routeList
        ,getSaveData:function () {
            var that = this;
            var routeList = [];
            var $item = $(that.element).find('input[name="itemCk"]:checked');
            if(that.settings.doType==2)
                $item = $(that.element).find('i[name="itemCk"]');

            $item.each(function (i) {
                var $this = $(this);
                routeList.push({
                    currentNodeId:$this.attr('data-current-node'),
                    nextNodeId:$this.attr('data-next-node'),
                    currentNodeName:$this.attr('data-current-text'),
                    nextNodeName:$this.attr('data-next-text'),
                    processId:that.settings.query.processId
                })
            });
            return routeList;
        }
        //请求数据{}
        ,save:function () {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_saveProcessNodeRoute;
            option.postData = {};
            option.postData.processId = that.settings.query.processId;

            option.postData.routeList = that.getSaveData();

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    S_toastr.success('操作成功！');


                    if(that.settings.fromType==2){
                        $(that.element).m_production_process_settings_list({
                            fromType:that.settings.fromType,
                            saveParam:that.settings.saveParam,
                            postParam:that.settings.postParam,
                            query:that.settings.query
                        },true);
                    }else{
                        location.hash = getUrlParamStr('/project/production/processSettings/info',{
                            id:that.settings.query.id,
                            taskId:that.settings.query.taskId,
                            projectName:that.settings.query.projectName,
                            dataCompanyId:that.settings.query.dataCompanyId,
                            processType:that.settings.query.processType,
                            processId:that.settings.query.processId
                        });
                    }

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //初始化iCheck
        ,initICheck:function () {
            var that = this;
            var ifChecked = function (e) {
                that.renderFlow();
            };
            var ifUnchecked = function (e) {
                that.renderFlow();
            };
            var ifClicked = function (e) {

            };
            $(that.element).find('input[name="itemCk"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked).on('ifClicked',ifClicked);
        }
        //事件绑定
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function (e) {

                var $this = $(this), dataAction = $this.attr('data-action');
                switch (dataAction){
                    case "save"://保存
                        if (that._statusList==null || that._statusList.length==0) {
                            S_toastr.error('请添加流程状态');
                            return false;
                        }
                        that.save();
                        return false;
                        break;
                    case "back"://保存并返回生产列表
                        location.hash = getUrlParamStr('/project/production',{
                            id:that.settings.query.id,
                            projectName:that.settings.query.projectName,
                            dataCompanyId:that.settings.query.dataCompanyId
                        });
                        return false;
                        break;
                    case 'cancel'://取消
                        if(that.settings.fromType==1){
                            location.hash = getUrlParamStr('/project/production/processSettings/list',{
                                id:that.settings.query.id,
                                taskId:that.settings.query.taskId,
                                projectName:that.settings.query.projectName,
                                dataCompanyId:that.settings.query.dataCompanyId,
                                processType:that.settings.query.processType
                            });
                        }else{
                            $(that.element).m_production_process_settings_list({
                                fromType:that.settings.fromType,
                                saveParam:that.settings.saveParam,
                                postParam:that.settings.postParam,
                                query:that.settings.query
                            },true);
                        }

                        break;


                }
            });
        }

        ,bindDragFun:function () {

            var that = this;
            //var $drag = $(that.element).find('#contentResize');
            var resize = document.getElementById("contentResize");
            var left = document.getElementById("contentLeft");
            var right = document.getElementById("contentRight");
            var box = document.getElementById("contentRow");
            resize.onmousedown = function(e){
                var startX = e.clientX;
                resize.left = resize.offsetLeft;
                document.onmousemove = function(e){
                    var endX = e.clientX;

                    var moveLen = resize.left + (endX - startX);
                    var maxT = box.clientWidth - resize.offsetWidth;
                    if(moveLen<150) moveLen = 150;
                    if(moveLen>maxT-150) moveLen = maxT-150;

                    resize.style.left = moveLen;
                    left.style.width = moveLen + "px";
                    right.style.width = (box.clientWidth - moveLen - 5) + "px";
                };
                document.onmouseup = function(evt){
                    document.onmousemove = null;
                    document.onmouseup = null;
                    resize.releaseCapture && resize.releaseCapture();
                };
                resize.setCapture && resize.setCapture();
                return false;
            }
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
