/**
 * 生产安排-流程设置-状态自定义
 * Created by wrb on 2019/6/13.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_production_process_workflow_status",
        defaults = {
            fromType:1,//1=默认生产安排入口，2=后台模板
            saveParam:null,//保存请求多余参数
            postParam:null,//请求多余参数
            initCallBack:null,
            sortCallBack:null,
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
                name:'生产安排',
                url:getUrlParamStr('#/project/production',{
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
                url:getUrlParamStr('#/project/production/processSettings/list',{
                    id:this.settings.query.id,
                    projectName:this.settings.query.projectName,
                    dataCompanyId:this.settings.query.dataCompanyId,
                    processType:this.settings.query.processType
                })
            },
            {
                name:'状态自定义'
            }
        ];

        this._isAllAgree = 0;//是否全部同意
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function (t) {
            var that = this;
            that.getData(t,function () {
                var html = template('m_project_process/m_production_process_workflow_status',{
                    fromType:that.settings.fromType,
                    dataList:that._statusList
                });
                $(that.element).html(html);
                if(that.settings.initCallBack)
                    that.settings.initCallBack(that._statusList);

                that.initICheck();
                that.save_validate();
                that.bindActionClick();
                that.bindSortable();
                if($(that.element).find('#breadcrumb').length>0)
                    $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);
            });
        }
        //请求数据
        ,getData:function (t,callBack) {
            var that = this;

            if(t==1){
                if(callBack)
                    callBack();
            }else{
                var option = {};
                option.url = restApi.url_listProcessNode;
                option.postData = {
                    processId:that.settings.query.processId
                };
                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {
                        that._statusList =  response.data;
                        /*if(that._statusList!=null && that._statusList.length>0)
                            that._isAllAgree = that._statusList[that._statusList.length-1].isAllAgree;*/

                        if(callBack)
                            callBack();

                    } else {
                        S_layer.error(response.info);
                    }
                });
            }

        }
        //请求数据
        ,save:function () {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_saveProcessNodeList;
            option.postData = {};
            option.postData.processId = that.settings.query.processId;
            //option.postData.isAllAgree = that._isAllAgree;
            option.postData.nodeList = that._statusList;

            /*if(option.postData.nodeList!=null && option.postData.nodeList.length>0)
                option.postData.nodeList[option.postData.nodeList.length-1].isAllAgree = that._isAllAgree;*/

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    S_toastr.success('操作成功！');

                    if(that.settings.fromType==1){
                        location.hash = getUrlParamStr('/project/production/processSettings/edit',{
                            doType:3,
                            id:that.settings.query.id,
                            projectName:that.settings.query.projectName,
                            dataCompanyId:that.settings.query.dataCompanyId,
                            processType:that.settings.query.processType,
                            processId:that.settings.query.processId
                        });
                    }else{
                        $(that.element).m_production_process_workflow_route({
                            fromType:that.settings.fromType,
                            saveParam:that.settings.saveParam,
                            postParam:that.settings.postParam,
                            query:that.settings.query
                        },true);
                    }
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //初始化iCheck
        ,initICheck:function () {
            var that = this;

            var checkedFun = function ($this,t) {
                var index = $this.closest('tr').index();
                var name = $this.attr('name');
                if(name=='staCk'){
                    that._statusList[index].isStartNode=t;
                }else{
                    that._statusList[index].isEndNode=t;

                    if(t==1){
                        $this.closest('td').find('.btn[data-action="setFlowProcessStart"]').removeClass('hide');
                    }else{
                        $this.closest('td').find('.btn[data-action="setFlowProcessStart"]').addClass('hide');
                        that._statusList[index].isAllAgree=0;
                    }

                }
            };

            var ifChecked = function (e) {
                checkedFun($(this),1);
            };
            var ifUnchecked = function (e) {
                checkedFun($(this),0);
            };
            var ifClicked = function (e) {

            };
            $(that.element).find('.i-checks').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked).on('ifClicked',ifClicked);
        }
        //已选自定义属性排序拖拽
        , bindSortable: function () {
            var that = this;
            var sortable = Sortable.create(document.getElementById('sortTr'), {
                animation: 200,
                handle: '.list-tr-item',
                sort: true,
                dataIdAttr: 'data-sort-id',
                ghostClass: 'my-sortable-ghost',
                chosenClass: 'my-sortable-chosen',
                dragClass: 'my-sortable-drag',
                onAdd: function (evt){ //拖拽时候添加有新的节点的时候发生该事件
                    //console.log('onAdd.foo:', [evt.item, evt.from]);
                },
                onUpdate: function (evt){ //拖拽更新节点位置发生该事件
                    //console.log('onUpdate.foo:', [evt.item, evt.from]);
                },
                onRemove: function (evt){ //删除拖拽节点的时候促发该事件
                    //console.log('onRemove.foo:', [evt.item, evt.from]);
                },
                onStart:function(evt){ //开始拖拽出发该函数
                    //console.log('onStart.foo:', [evt.item, evt.from]);
                },
                onSort:function(evt){ //发生排序发生该事件
                    //console.log('onSort.foo:', [evt.item, evt.from]);
                },
                onEnd: function(evt){ //拖拽完毕之后发生该事件
                    //console.log('onEnd.foo:', [evt.item, evt.from]);
                    //console.log(evt);
                    that._statusList = sortList(evt.oldIndex,evt.newIndex,that._statusList);
                    console.log(that._statusList);
                    if(that.settings.sortCallBack)
                        that.settings.sortCallBack(that._statusList);
                }
            });
            //Sortable.create(selectedFieldBox, { /* options */ });
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
                        if (that._statusList!=null && that._statusList.length>0 && that._statusList[0].isStartNode!=1) {
                            S_toastr.error('请选择起始状态');
                            return false;
                        }
                        that.save();
                        break;
                    case 'cancel'://取消

                        if(that.settings.fromType==1){
                            location.hash = getUrlParamStr('/project/production/processSettings/list',{
                                id:that.settings.query.id,
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
                    case 'addWorkflowStatus'://添加状态

                        $('body').m_production_process_workflow_status_add({
                            processId:that.settings.query.processId,
                            statusList:that._statusList,
                            saveCallBack:function (data) {
                                that._statusList.push(data);
                                that.init(1);
                            }
                        },true);
                        break;
                    case 'editWorkflowStatus'://编辑状态

                        var index = $this.closest('tr').index();
                        $('body').m_production_process_workflow_status_add({
                            processId:that.settings.query.processId,
                            statusList:that._statusList,
                            dataInfo: that._statusList[index],
                            saveCallBack:function (data) {
                                //that._statusList.push(data);
                                that._statusList[index] = data;
                                that.init(1);
                            }
                        },true);
                        break;
                    case 'delWorkflowStatus'://删除状态
                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {
                            var index = $this.closest('tr').index();
                            that._statusList.splice(index,1);
                            that.init(1);
                        }, function () {
                        });
                        break;

                    case 'setFlowProcessStart':
                        var index = $this.closest('tr').index();
                        $('body').m_production_process_workflow_start({
                            isAllAgree:that._statusList[index].isAllAgree,
                            saveCallBack:function (data) {
                                //that._isAllAgree = data;
                                that._statusList[index].isAllAgree=data;
                            }
                        },true);
                        break;

                }
                return false;
                e.stopPropagation();
            });
        }
        //保存验证
        , save_validate: function () {
            var that = this;
            $(that.element).find('form').validate({
                rules: {
                    processName: {
                        required: true,
                        maxlength:50
                    }
                },
                messages: {
                    processName: {
                        required: '设计任务不能为空',
                        maxlength: '设计任务名称请控制在50字符内'
                    }
                },
                errorElement: "label",  //用来创建错误提示信息标签
                errorPlacement: function (error, element) {  //重新编辑error信息的显示位置
                    error.appendTo(element.closest('div'));
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
