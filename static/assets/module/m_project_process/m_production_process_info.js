/**
 * 生产安排-流程设置-列表
 * Created by wrb on 2019/6/14.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_production_process_info",
        defaults = {
            fromType:1,//1=默认生产安排入口，2=后台模板
            saveParam:null,//保存请求多余参数
            postParam:null,//请求多余参数
            processInfo:null,
            query:{}//{dataCompanyId,id(projectId),projectName,processType(1：生产任务:2：图纸:3：校审意见),processId}
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;//当前组织ID

        /*this.settings.query.projectName = encodeURI(this.settings.query.projectName);
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
            {
                name:'流程设置',
                url:getUrlParamStr('#/project/production/processSettings/list',{
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
        ];*/
        this._processInfo = [];//流程信息
        this._nodeIdsList = [];
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.getData(function (data) {
                data.query = that.settings.query;
                data.fromType = that.settings.fromType;
                var html = template('m_project_process/m_production_process_info',data);
                $(that.element).html(html);
                //that.bindActionClick();

                //计算多少个node
                var nodeArr = [];

                if(that._processInfo.routeList){
                    $.each(that._processInfo.routeList,function (i,item) {
                        //判断元素是否存在于new_arr中，如果不存在则插入到new_arr的最后
                        if($.inArray(item.currentNodeId,nodeArr)==-1) {
                            nodeArr.push(item.currentNodeId);
                        }
                        if($.inArray(item.nextNodeId,nodeArr)==-1) {
                            nodeArr.push(item.nextNodeId);
                        }
                    })
                }
                that._nodeIdsList = nodeArr;


                that.renderFlow(that._processInfo.routeList,that._processInfo.statusList);
                /*if($(that.element).find('#breadcrumb').length>0)
                    $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);*/

            });
        }
        //请求数据
        ,getData:function (callBack) {
            var that = this;
            if(that.settings.processInfo){
                that._processInfo = that.settings.processInfo;
                if(callBack)
                    callBack(that.settings.processInfo);
            }else{
                var option = {};
                option.url = restApi.url_getProcessDetail;
                option.postData = {
                    id:that.settings.query.processId
                };
                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {

                        that._processInfo = response.data;
                        if(callBack)
                            callBack(response.data);

                    } else {
                        S_layer.error(response.info);
                    }
                });
            }
        }
        //事件绑定
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function (e) {

                var $this = $(this),dataAction = $this.attr('data-action');
                switch (dataAction){

                    case "editWorkflow"://编辑工作流
                        if(that.settings.fromType==1){
                            location.hash = getUrlParamStr('/project/production/processSettings/edit',{
                                doType:1,
                                id:that.settings.query.id,
                                taskId:that.settings.query.taskId,
                                projectName:that.settings.query.projectName,
                                dataCompanyId:that.settings.query.dataCompanyId,
                                processType:that.settings.query.processType,
                                processId:that.settings.query.processId
                            });
                        }else{
                            $(that.element).m_production_process_settings_add({
                                fromType:that.settings.fromType,
                                saveParam:that.settings.saveParam,
                                postParam:that.settings.postParam,
                                query:that.settings.query
                            },true);
                        }

                        break;

                    case 'backWorkflowList':
                        $(that.element).m_production_process_settings_list({
                            fromType:that.settings.fromType,
                            saveParam:that.settings.saveParam,
                            postParam:that.settings.postParam,
                            query:that.settings.query
                        },true);
                        break;

                }
                e.stopPropagation();
            });

        }
        ,renderFlow:function (routeList,statusList) {
            var that = this;
            var graph = new joint.dia.Graph();
            var pointIndexL = 0,pointIndexR = 0;
            var leftOut = [],leftIn = [],rightOut = [],rightIn=[];//左出，左进，右出，右进
            //定义连线
            var link = function(source, target, label,t){
                var cell = new joint.shapes.standard.Link({
                    source: { id: source.id },
                    target: { id: target.id },
                    labels: [{ position: 0.5, attrs: { text: { text: label || '', 'font-weight': 'bold','font-size': '12px' } } }],
                    router: { name: 'manhattan' },//设置连线弯曲样式 manhattan直角
                    attrs: {
                        '.marker-target': {
                            fill: '#333333',//箭头颜色
                            d: 'M 10 0 L 0 5 L 10 10 z'//箭头样式
                        },
                        line: {
                            stroke: '#333333', // SVG attribute and value
                            'stroke-width': 0.5,//连线粗细
                            targetMarker: { // minute hand
                                'fill': '#F8FAFE'
                            }
                        }
                    }
                });
                graph.addCell(cell);

                //console.log(source)
                //console.log(target)
                //console.log(target.attributes.position.y-source.attributes.position.y)
                var interval = target.attributes.position.y-source.attributes.position.y;
                //Math.abs(interval)
                /*if(interval>80){

                    var sourcex = source.attributes.position.x;
                    var sourcey = source.attributes.position.y+20;
                    var targetx = target.attributes.position.x;
                    var targety = target.attributes.position.y+20;

                    cell.source({ x: sourcex, y: sourcey});
                    cell.target({ x: targetx, y: targety });
                    cell.vertices([{ x: 180-pointIndexL*10, y: sourcey }]);
                    pointIndexL++;
                }
                if(interval<-80){

                    var width = source.attributes.size.width;
                    var sourcex = source.attributes.position.x+width;
                    var sourcey = source.attributes.position.y+20;
                    var targetx = target.attributes.position.x+width;
                    var targety = target.attributes.position.y+20;

                    cell.source({ x: sourcex, y: sourcey});
                    cell.target({ x: targetx, y: targety });
                    cell.vertices([{ x: 220+width+pointIndexR*10, y: sourcey }]);
                    pointIndexR++;
                }*/
                if(Math.abs(interval)>80){

                    var width = Math.round(source.attributes.size.width);
                    var sourcex = source.attributes.position.x;
                    var sourcey = source.attributes.position.y+20;

                    var targetx = target.attributes.position.x;
                    var targety = target.attributes.position.y+20;

                    //右原始
                    var flag1 = rightOut.indexOf(source.id)<0 && rightIn.indexOf(source.id)<0;//非进&非出
                    var flag2 = rightOut.indexOf(source.id)>-1 && rightIn.indexOf(source.id)<0;//出&非进

                    //右目标
                    var flag3 = rightOut.indexOf(target.id)<0 && rightIn.indexOf(target.id)<0;//非进&非出
                    var flag4 = rightOut.indexOf(target.id)<0 && rightIn.indexOf(target.id)>-1;//非出&进

                    //左原始
                    var flagL1 = leftOut.indexOf(source.id)<0 && leftIn.indexOf(source.id)<0;//非进&非出
                    var flagL2 = leftOut.indexOf(source.id)>-1 && leftIn.indexOf(source.id)<0;//出&非进

                    //左目标
                    var flagL3 = leftOut.indexOf(target.id)<0 && leftIn.indexOf(target.id)<0;//非进&非出
                    var flagL4 = leftOut.indexOf(target.id)<0 && leftIn.indexOf(target.id)>-1;//非出&进

                    if((flag1||flag2) && (flag3||flag4)){

                        cell.source({ x: sourcex+width, y: sourcey});
                        cell.target({ x: targetx+width, y: targety });
                        cell.vertices([{ x: setX+20+width+pointIndexR*10, y: sourcey }]);
                        pointIndexR++;

                        if(rightOut.indexOf(source.id)<0 || rightOut.length==0){
                            rightOut.push(source.id);
                        }
                        if(rightIn.indexOf(target.id)<0 || rightIn.length==0){
                            rightIn.push(target.id);
                        }

                    }else{

                        cell.source({ x: sourcex, y: sourcey});
                        cell.target({ x: targetx, y: targety });
                        cell.vertices([{ x: setX-20-pointIndexL*10, y: sourcey }]);
                        pointIndexL++;

                        if(leftOut.indexOf(source.id)<0 || leftOut.length==0){
                            leftOut.push(source.id);
                        }
                        if(leftIn.indexOf(target.id)<0 || leftIn.length==0){
                            leftIn.push(target.id);
                        }

                    }
                }
                return cell;
            };

            var ElementView = joint.dia.ElementView.extend({
                pointerdown: function () {
                    this._click = true;
                    joint.dia.ElementView.prototype.pointerdown.apply(this, arguments);
                },
                pointermove: function(evt, x, y) {
                    this._click = false;
                },
                pointerup: function (evt, x, y) {
                    this._click = true;
                    if (this._click) {
                        this.notify('cell:click', evt, x, y);
                    } else {
                        joint.dia.ElementView.prototype.pointerup.apply(this, arguments);
                    }
                }
            });

            var LinkView = joint.dia.LinkView.extend({
                addVertex: function(evt, x, y) {},
                removeVertex: function(endType) {},
                pointerdown:function(evt, x, y) {}
            });

            //定义画布
            var paperWidth = $('#flowPaper').width();
            var paper = new joint.dia.Paper({
                el: $('#flowPaper'),
                width: paperWidth-35,
                height: that._nodeIdsList.length*80,
                gridSize: 1,
                model: graph,
                elementView: ElementView,
                linkView:LinkView
            });
            var shapesSize = paperWidth/5;
            //定义框的形状
            var state = function(x, y, shape, background, text){
                var cell;
                var textColor,strokeWidth;
                if(background=="#009ACD"||background=="#FB9900" || background=="#EE5C42") {
                    textColor = "white";
                    strokeWidth = "0"
                }else {
                    textColor = "black";
                    strokeWidth = "1"
                }

                if(shape==="rect"){
                    cell = new joint.shapes.standard.Rectangle();
                    cell.resize(shapesSize, 40);
                    cell.position(x, y);
                    cell.attr('label/text', text);
                    cell.attr('label/font-size', '14px');
                    cell.attr('label/fill', textColor);
                    cell.attr('body/refPoints', '0,5 10,0 20,5 10,10');
                    cell.attr('body/fill', background);
                    cell.attr('body/strokeWidth', strokeWidth);
                    cell.attr('body/stroke', '#999999');
                    cell.attr('body/rx', '5px');
                    cell.attr('body/ry', '5px');

                }  else if(shape==="rect"){
                    cell = new joint.shapes.basic.Rect({
                        position: { x: x, y: y },//坐标
                        size: { width: shapesSize, height: 40 },//宽高
                        attrs: {
                            rect: {
                                fill: background,
                                stroke: '#999999',//边框颜色
                                'stroke-width': 1 ,//边框大小
                                rx:'5px',
                                ry: '5px'
                            },
                            text: { text: text,fill:textColor}, //显示文字
                        }
                    });
                } else if(shape==="ellipse"){
                    cell = new joint.shapes.basic.Rect({
                        position: { x: x, y: y },//坐标
                        size: { width: shapesSize, height: 40 },//宽高
                        attrs: {
                            rect: {
                                fill: background,
                                stroke: '#999999',//边框颜色
                                'stroke-width': strokeWidth,//边框大小
                                rx:'28px',
                                ry: '28px'
                            },
                            text: { text: text,fill:textColor } //显示文字
                        }
                    });
                } else if(shape==="polygon") {
                    cell = new joint.shapes.standard.Polygon();
                    cell.resize(shapesSize, 40);
                    cell.position(x, y);
                    cell.attr('label/text', text);
                    cell.attr('label/font-size', '12px');
                    cell.attr('label/fill', textColor);

                    cell.attr('body/refPoints', '0,5 10,0 20,5 10,10');
                    cell.attr('body/fill', background);
                    cell.attr('body/strokeWidth', '1');
                } else if(shape==="circle") {
                    var cell = new joint.shapes.standard.Circle();
                    cell.resize(20, 20);
                    cell.position(x, y);
                    cell.attr('root/title', 'joint.shapes.standard.Circle');
                    cell.attr('label/text', text);
                    cell.attr('label/fill', 'white');
                    cell.attr('body/fill', background);
                    cell.attr('body/strokeWidth', '0');
                    cell.attr('label/fill', textColor);
                    cell.attr('label/font-size', '12px');
                }
                graph.addCell(cell);
                return cell;
            };

            //创建元素
            //定义形状
            var setX = paperWidth/2-shapesSize/2;//200;     //初始的x軸位置
            var setY = 20;    //初始的y軸位置
            var addSetX = paperWidth/8;
            var addSetY = 80;


            setY = setY-addSetY;


            /*var state0 = state(setX,setY+addSetY,"rect","#009ACD", "规划中");
             var state1 = state(setX,setY+addSetY*2,"rect","#009ACD","实现中");
             link(state0,state0,"");
             var state2 = state(setX,setY+addSetY*3,"rect","#009ACD","已实现");

            link(state1,state2,"");
            var state3 = state(setX,setY+addSetY*4,"rect","#009ACD","已拒绝");
            link(state3,state0,"");
            link(state2,state0,"");
            link(state1,state3,"");
            link(state0,state3,"");*/

            var stateArr = [],stateIndex=1;
            var stateObj = {};

            $.each(statusList,function (i,item) {
                stateObj[item.id] = state(setX,setY+addSetY*stateIndex,"rect","#F8FAFE", item.nodeName);
                stateIndex++;
            });
            stateIndex = 1;
            $.each(routeList,function (i,item) {

                if(stateArr.join(',').indexOf(item.currentNodeId)<0){
                    //stateObj[item.currentNodeId] = state(setX,setY+addSetY*stateIndex,"rect","#F8FAFE", item.currentNodeName);
                    stateArr.push(item.currentNodeId);
                    stateIndex++;
                }
                if(stateArr.join(',').indexOf(item.nextNodeId)<0){
                    //stateObj[item.nextNodeId] = state(setX,setY+addSetY*stateIndex,"rect","#F8FAFE", item.nextNodeName);
                    stateArr.push(item.nextNodeId);
                    stateIndex++;
                }
                if(item.currentNodeId!=item.nextNodeId){
                    link(stateObj[item.currentNodeId],stateObj[item.nextNodeId],"");
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
