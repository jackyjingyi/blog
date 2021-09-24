/**
 * 排班表
 * Created by wrb on 2018/10/15.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_attendance_arrange_work",
        defaults = {
            isDialog:true,
            userList:null,//人员
            periodList:null,//班次
            arrangeWorkList:null,//人员排班记录
            okCallBack:null
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;
        this._arrangeWorkList = [];//排班列表

        if(this.settings.arrangeWorkList!=null && this.settings.arrangeWorkList.length>0)
            this._arrangeWorkList = this.settings.arrangeWorkList;
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            $.each(that.settings.periodList,function (i,item) {
                //红，绿，蓝三原色，10进制码转16进制，随机数1到256之间
                var red = parseInt(Math.random()*257).toString(16);
                var blue = parseInt(Math.random()*257).toString(16);
                var green= parseInt(Math.random()*257).toString(16);
                var color = '#'+red+blue+green;

                item.color = color;

            });

            that.render();

        }
        //month=YYYY年MM月
        , render: function (month) {
            var that = this;

            var selectedYear = new Date().getFullYear();
            var selectedMonth = new Date().getMonth()+1;
            var lastDay = getLastDay(selectedYear,selectedMonth);

            if(month!=null){
                selectedYear = month.substring(0,4);
                selectedMonth = month.substring(5,7);
            }

            if(parseInt(selectedMonth)<10)
                selectedMonth = '0'+parseInt(selectedMonth);

            month = selectedYear+'年'+selectedMonth+'月';

            var days = [];
            for(var i=1;i<=lastDay;i++){
                var day = i+'';
                if(i<10)
                    day = '0'+i;
                days.push({
                    day:i,
                    date:selectedYear+'-'+selectedMonth+'-'+day
                });
            }

            var html = template('m_attendance/m_attendance_arrange_work', {month:month,days:days,userList:that.settings.userList,periodList:that.settings.periodList});
            that.renderPage(html,function () {

                that.bindSelectDate();
                that.bindActionClick();
                that.disableTd();
                that.setMark();
            });
        }
        //渲染界面
        ,renderPage:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title|| '编辑排班',
                    area : '1150px',
                    maxHeight:'750',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        if(that.settings.okCallBack)
                            that.settings.okCallBack(that._arrangeWorkList);

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
        //初始化iCheck
        ,initICheck:function () {
            var that = this;
            $(that.element).find('.i-checks').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            });
        }
        //初始化select
        ,initSelect:function () {
            var that = this;
            $(that.element).find('select.select-control').select2({
                allowClear: false,
                language: "zh-CN",
                minimumResultsForSearch: Infinity
            });
        }
        ,bindSelectDate:function () {
            var that = this;
            $(that.element).find('input[name="selectDate"]').on('click',function () {

                var onpicked =function(dp){
                    that.render(dp.cal.getNewDateStr());
                };
                WdatePicker({el:this,dateFmt:'yyyy年MM月',isShowClear:false,onpicked:onpicked})
            });
        }
        ,disableTd:function () {
            var that = this;
            $(that.element).find('.user-row td[data-date]').each(function () {
                var date = $(this).attr('data-date');
                var currDate = getNowDate();
                var days = dateDiff(currDate,date);
                if(days>0)
                    $(this).addClass('bg-v1-grey');

            });
        }
        //当前月设置标识
        ,setMark:function () {
            var that = this;
            //人员横排配置标识
            $.each(that._arrangeWorkList,function (i,item) {

                var $td = $(that.element).find('tr.user-row[data-id="'+item.companyUserId+'"] td[data-date="'+item.workDate+'"]');
                var color = $(that.element).find('tr.period-row[data-id="'+item.periodId+'"]').attr('data-color');
                var periodText = $(that.element).find('tr.period-row[data-id="'+item.periodId+'"] td:first').text();
                periodText = $.trim(periodText);

                //var itemId = item.id?item.id:item.settingId;//编辑取settingId
                $td.attr('data-key',item.id);//记录标识
                if(item.periodId=='rest'){
                    var $span = $('<span class="period-row-cell" data-period-id="'+item.periodId+'">休</span>');
                }else{
                    var $span = $('<span class="period-row-cell" data-period-id="'+item.periodId+'">'+(periodText.substring(0,1))+'</span>');
                }
                //$span.css('border-bottom','solid 2px'+ color);
                $span.css('background-color',color);
                $span.trigger('create');  //重新加载所在标签的样式
                $td.html('');
                $span.appendTo($td);
            });

            $(that.element).find('tr.period-row td').each(function (i) {
                var $this = $(this);
                var workDate = $this.attr('data-date');
                if(isNullOrBlank(workDate))
                    return true;

                var periodId = $this.closest('tr').attr('data-id');
                var periodLenByDate = $(that.element).find('tr.user-row td[data-date="'+workDate+'"] span[data-period-id="'+periodId+'"]').length;
                if(periodLenByDate>0){
                    $this.text(periodLenByDate);
                }else{
                    $this.text('');
                }
            });
        }
        //事件绑定
        ,bindActionClick:function () {
            var that = this;

            var periodSelect = function ($this,workDate) {
                var $ul = $('<ul class="list-group m-b-none"></ul>');

                $.each(that.settings.periodList,function (i,item) {
                    $('<li class="list-group-item no-borders curp" data-id="'+(item.id==null?item.itemKey:item.id)+'">'+item.classesName+'</li>').appendTo($ul);
                });
                $('<li class="list-group-item no-borders curp" data-id="rest">休息</li>').appendTo($ul);
                $this.m_floating_popover({
                    content:$ul.prop('outerHTML'),
                    placement:'right',
                    renderedCallBack:function ($popover) {
                        $popover.css('z-index','19891099');
                        $popover.find('li').hover(function () {
                            $(this).css('background','#ecf6fd');
                        },function () {
                            $(this).css('background','none');
                        });

                        $popover.find('li').on('click',function () {
                            var periodId = $(this).attr('data-id');
                            var oldKey = $this.attr('data-key');


                            var dealData = function (oldKey,$$this) {
                                if(!isNullOrBlank(oldKey)){//不为空，去掉旧记录
                                    delObjectInArray(that._arrangeWorkList,function (obj) {
                                        return obj.id == oldKey;
                                    });
                                }
                                var newWorkDate = $$this.attr('data-date');
                                var key = UUID.genV4().hexNoDelim;
                                $$this.attr('data-key',key);
                                that._arrangeWorkList.push({
                                    id:key,
                                    companyUserId:$$this.closest('tr').attr('data-id'),
                                    workDate:newWorkDate,
                                    periodId:periodId
                                });
                            };

                            if($this.hasClass('user-name')){//点击人员姓名
                                var userId = $this.closest('tr').attr('data-id');
                                $(that.element).find('.table-content tr.user-row[data-id="'+userId+'"] td').each(function (i) {
                                    if($(this).hasClass('bg-v1-grey') || $(this).hasClass('user-name'))
                                        return true;
                                    var itemKey = $(this).attr('data-key');
                                    dealData(itemKey,$(this));
                                });

                            }else if($this.hasClass('date-head')){//点击日期表头

                                $(that.element).find('.table-content td[data-date="'+workDate+'"]').each(function (i) {
                                    if($(this).hasClass('bg-v1-grey'))
                                        return true;
                                    var itemKey = $(this).attr('data-key');
                                    dealData(itemKey,$(this));
                                });

                            }else{//点击单个

                                dealData(oldKey,$this);
                            }

                            that.setMark();
                            $this.m_floating_popover('closePopover');//关闭浮窗
                        })
                    }

                },true);
            };
            $(that.element).find('tr.user-row td').off('click').on('click',function (e) {

                var $this = $(this);
                var workDate = $this.attr('data-date');
                if($this.hasClass('bg-v1-grey'))
                    return false;

                $(that.element).find('.attendance-edit-border1').hide();
                var top = $this.position().top+$(that.element).find('.table-content').scrollTop();
                var left = $this.position().left;
                var width = $this.css('width');
                var height = $this.css('height');

                if($this.hasClass('user-name')){
                    width = $this.closest('tr').css('width');
                }

                $(that.element).find('.attendance-edit-border').css({
                    'position': 'absolute',
                    'display': 'block',
                    'top': top+'px',
                    'left': left+'px',
                    'width':width,
                    'height':height
                });

                periodSelect($this,workDate);
                return false;
                stopPropagation(e);
            });

            $(that.element).find('tr th').off('click').on('click',function (e) {

                var $this = $(this);
                var workDate = $this.attr('data-date');

                $(that.element).find('.attendance-edit-border').hide();
                var top = $this.position().top;
                var left = $this.position().left;
                var width = $this.css('width');
                var height = (parseInt($this.css('height'))+$(that.element).find('.table-content ').height())+'px';

                $(that.element).find('.attendance-edit-border1').css({
                    'position': 'absolute',
                    'display': 'block',
                    'top': top+'px',
                    'left': left+'px',
                    'width':width,
                    'height':height
                });

                periodSelect($this,workDate);
                return false;
                stopPropagation(e);
            });

            $(that.element).find('.attendance-edit-border').off('click').on('click',function () {
                $(this).hide();
            });
            $(that.element).find('.attendance-edit-border1').off('click').on('click',function () {
                $(this).hide();
            });

            //上个月
            $(that.element).find('a[data-action="prevDate"]').off('click').on('click',function () {

                var selectedDate = $(that.element).find('input[name="selectDate"]').val();
                var year = selectedDate.substring(0,4);
                var month = selectedDate.substring(5,7);

                if(parseInt(month)==1){
                    year = parseInt(year) - 1;
                    month = '12';
                }else{
                    month = parseInt(month) - 1;
                }

                if(parseInt(month)<10)
                    month = '0'+parseInt(month);

                var yyyyHH = year+'年'+month+'月';

                that.render(yyyyHH);

            });
            //下个月
            $(that.element).find('a[data-action="nextDate"]').off('click').on('click',function () {

                var selectedDate = $(that.element).find('input[name="selectDate"]').val();
                var year = selectedDate.substring(0,4);
                var month = selectedDate.substring(5,7);

                if(parseInt(month)==12){
                    year = parseInt(year) + 1;
                    month = '01';
                }else{
                    month = parseInt(month) + 1;
                }

                if(parseInt(month)<10)
                    month = '0'+parseInt(month);

                var yyyyHH = year+'年'+month+'月';

                that.render(yyyyHH);
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
